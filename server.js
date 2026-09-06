const fs = require("fs");
const path = require("path");
const http = require("http");
const crypto = require("crypto");
const express = require("express");
const bcrypt = require("bcryptjs");
const { Server } = require("socket.io");

const PORT = process.env.PORT || 8080;
const HOST = "0.0.0.0";
const DATA_DIR = path.join(__dirname, "data");
const DB_FILE = path.join(DATA_DIR, "db.json");
const JOIN_BONUS = 50;
const REF_BONUS = 20;
const MIN_WITHDRAW = 100;

const TASKS = [
  { id: "t1", icon: "👍", reward: 5, titleBn: "ফেসবুক পেজ লাইক করুন", titleEn: "Like a Facebook page" },
  { id: "t2", icon: "▶️", reward: 8, titleBn: "ইউটিউব ভিডিও দেখুন", titleEn: "Watch a YouTube video" },
  { id: "t3", icon: "⭐", reward: 12, titleBn: "অ্যাপ রিভিউ দিন", titleEn: "Write an app review" },
  { id: "t4", icon: "📋", reward: 15, titleBn: "ছোট সার্ভে পূরণ করুন", titleEn: "Complete a short survey" },
  { id: "t5", icon: "🌐", reward: 3, titleBn: "ওয়েবসাইট ভিজিট করুন", titleEn: "Visit a website" },
  { id: "t6", icon: "📲", reward: 20, titleBn: "অ্যাপ ইনস্টল করুন", titleEn: "Install an app" },
  { id: "t7", icon: "💬", reward: 7, titleBn: "পোস্টে কমেন্ট করুন", titleEn: "Comment on a post" },
  { id: "t8", icon: "🎯", reward: 25, titleBn: "অফার ক্লেইম করুন", titleEn: "Claim a partner offer" }
];

const AVATARS = [
  "/assets/img/avatar-1.jpg",
  "/assets/img/avatar-2.jpg",
  "/assets/img/avatar-3.jpg",
  "/assets/img/avatar-4.jpg"
];

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}
function uid(n = 8) {
  return crypto.randomBytes(n).toString("hex").slice(0, n).toUpperCase();
}
function normPhone(phone) {
  return String(phone || "").replace(/\D/g, "").replace(/^0+/, "");
}
function publicUser(u) {
  if (!u) return null;
  return {
    id: u.id,
    name: u.name,
    phone: u.phone,
    dial: u.dial,
    country: u.country,
    balance: u.balance,
    today: u.today,
    todayDate: u.todayDate,
    earned: u.earned,
    tasksDone: u.tasksDone,
    refs: u.refs,
    code: u.code,
    activity: u.activity,
    withdraws: u.withdraws
  };
}

function loadDb() {
  try {
    return JSON.parse(fs.readFileSync(DB_FILE, "utf8"));
  } catch {
    return null;
  }
}

function saveDb() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
}

function seedDb() {
  const passHash = bcrypt.hashSync("123456", 10);
  const demo = {
    id: "demo",
    name: "Demo User",
    phone: "1700000000",
    dial: "+880",
    country: "bd",
    passHash,
    balance: 320,
    today: 45,
    todayDate: todayKey(),
    earned: 860,
    tasksDone: ["t5"],
    refs: 3,
    code: "EASY320",
    referredBy: null,
    activity: [
      { t: "জয়েনিং বোনাস", a: 50, at: Date.now() - 86400000 * 4 },
      { t: "ওয়েবসাইট ভিজিট", a: 3, at: Date.now() - 3600000 },
      { t: "উইথড্র · bKash", a: -200, at: Date.now() - 7200000 }
    ],
    withdraws: [
      { id: "W1", method: "bKash", amount: 200, wallet: "01700000000", status: "paid", at: Date.now() - 7200000 }
    ],
    createdAt: Date.now() - 86400000 * 4
  };
  return {
    users: [demo],
    sessions: {},
    ticker: [
      { name: "রাকিব হোসেন", amount: 350, method: "bKash", country: "bd", img: AVATARS[0], at: Date.now() - 60000 },
      { name: "সুমাইয়া আক্তার", amount: 180, method: "Nagad", country: "bd", img: AVATARS[1], at: Date.now() - 120000 },
      { name: "মাহমুদুল হাসান", amount: 500, method: "Rocket", country: "bd", img: AVATARS[2], at: Date.now() - 180000 },
      { name: "নুসরাত জাহান", amount: 220, method: "bKash", country: "bd", img: AVATARS[3], at: Date.now() - 240000 }
    ]
  };
}

let db = loadDb() || seedDb();
if (!db.users || !db.sessions) db = seedDb();
saveDb();

function findUserByPhone(phone) {
  const p = normPhone(phone);
  return db.users.find(u => u.phone === p || u.phone === phone);
}
function findUser(id) {
  return db.users.find(u => u.id === id);
}
function resetToday(u) {
  if (u.todayDate !== todayKey()) {
    u.today = 0;
    u.todayDate = todayKey();
  }
}
function createSession(userId) {
  const token = crypto.randomBytes(24).toString("hex");
  db.sessions[token] = { userId, exp: Date.now() + 1000 * 60 * 60 * 24 * 30 };
  saveDb();
  return token;
}
function authUser(req) {
  const h = req.headers.authorization || "";
  const token = h.startsWith("Bearer ") ? h.slice(7) : "";
  const s = db.sessions[token];
  if (!s || s.exp < Date.now()) return null;
  const u = findUser(s.userId);
  if (!u) return null;
  resetToday(u);
  return u;
}

function stats() {
  const paid = db.users.reduce((sum, u) => {
    return sum + (u.withdraws || []).filter(w => w.status === "paid").reduce((s, w) => s + w.amount, 0);
  }, 0);
  return {
    users: db.users.length,
    paid,
    online: io ? io.engine.clientsCount : 0,
    rating: "4.9"
  };
}

function pushTicker(item) {
  db.ticker.unshift(item);
  db.ticker = db.ticker.slice(0, 40);
  saveDb();
  io.emit("ticker", item);
  io.emit("stats", stats());
}

const app = express();
app.disable("x-powered-by");
app.use(express.json({ limit: "32kb" }));

app.get("/api/health", (_req, res) => res.json({ ok: true }));

app.get("/api/public", (_req, res) => {
  res.json({
    ...stats(),
    ticker: db.ticker.slice(0, 12)
  });
});

app.get("/api/tasks", (_req, res) => res.json({ tasks: TASKS }));

app.post("/api/register", (req, res) => {
  const { name, phone, dial, country, pass, ref } = req.body || {};
  if (!String(name || "").trim()) return res.status(400).json({ error: "errName" });
  const p = normPhone(phone);
  if (p.length < 7) return res.status(400).json({ error: "errPhone" });
  if (!pass || String(pass).length < 6) return res.status(400).json({ error: "errPass" });
  if (findUserByPhone(p)) return res.status(400).json({ error: "errExists" });

  const u = {
    id: uid(10),
    name: String(name).trim().slice(0, 40),
    phone: p,
    dial: String(dial || "+880").slice(0, 8),
    country: String(country || "bd").slice(0, 4),
    passHash: bcrypt.hashSync(String(pass), 10),
    balance: JOIN_BONUS,
    today: JOIN_BONUS,
    todayDate: todayKey(),
    earned: JOIN_BONUS,
    tasksDone: [],
    refs: 0,
    code: "ES" + uid(5),
    referredBy: null,
    activity: [{ t: "জয়েনিং বোনাস", a: JOIN_BONUS, at: Date.now() }],
    withdraws: [],
    createdAt: Date.now()
  };

  const referrer = db.users.find(x => x.code === String(ref || "").toUpperCase());
  if (referrer && referrer.id !== u.id) {
    u.referredBy = referrer.id;
    referrer.refs += 1;
    referrer.balance += REF_BONUS;
    referrer.today += REF_BONUS;
    referrer.earned += REF_BONUS;
    referrer.activity.unshift({ t: "রেফার বোনাস", a: REF_BONUS, at: Date.now() });
    io.to("user:" + referrer.id).emit("me", publicUser(referrer));
  }

  db.users.push(u);
  const token = createSession(u.id);
  saveDb();
  pushTicker({
    name: u.name,
    amount: JOIN_BONUS,
    method: "Bonus",
    country: u.country,
    img: AVATARS[db.users.length % AVATARS.length],
    at: Date.now(),
    kind: "join"
  });
  res.json({ token, user: publicUser(u) });
});

app.post("/api/login", (req, res) => {
  const { phone, pass } = req.body || {};
  const u = findUserByPhone(phone);
  if (!u || !bcrypt.compareSync(String(pass || ""), u.passHash)) {
    return res.status(401).json({ error: "errCred" });
  }
  resetToday(u);
  saveDb();
  const token = createSession(u.id);
  res.json({ token, user: publicUser(u) });
});

app.get("/api/me", (req, res) => {
  const u = authUser(req);
  if (!u) return res.status(401).json({ error: "needLogin" });
  res.json({ user: publicUser(u) });
});

app.post("/api/tasks/:id/complete", (req, res) => {
  const u = authUser(req);
  if (!u) return res.status(401).json({ error: "needLogin" });
  const task = TASKS.find(x => x.id === req.params.id);
  if (!task) return res.status(400).json({ error: "errTask" });
  if (u.tasksDone.includes(task.id)) return res.status(400).json({ error: "errTask" });
  resetToday(u);
  u.balance += task.reward;
  u.today += task.reward;
  u.earned += task.reward;
  u.tasksDone.push(task.id);
  u.activity.unshift({ t: task.titleBn, a: task.reward, at: Date.now() });
  saveDb();
  io.to("user:" + u.id).emit("me", publicUser(u));
  io.emit("stats", stats());
  res.json({ user: publicUser(u), reward: task.reward });
});

app.post("/api/withdraw", (req, res) => {
  const u = authUser(req);
  if (!u) return res.status(401).json({ error: "needLogin" });
  const amount = Number(req.body?.amount);
  const method = String(req.body?.method || "bKash");
  const wallet = String(req.body?.wallet || "").trim();
  if (!amount || amount < MIN_WITHDRAW) return res.status(400).json({ error: "errMin" });
  if (amount > u.balance) return res.status(400).json({ error: "errBal" });
  if (!wallet) return res.status(400).json({ error: "errWallet" });
  const allowed = ["bKash", "Nagad", "Rocket", "Binance"];
  const m = allowed.includes(method) ? method : "bKash";

  resetToday(u);
  u.balance -= amount;
  const wd = { id: "W" + uid(6), method: m, amount, wallet, status: "pending", at: Date.now() };
  u.withdraws.unshift(wd);
  u.activity.unshift({ t: `উইথড্র · ${m}`, a: -amount, at: Date.now() });
  saveDb();

  pushTicker({
    name: u.name,
    amount,
    method: m,
    country: u.country,
    img: AVATARS[Math.abs(u.name.length) % AVATARS.length],
    at: Date.now(),
    kind: "withdraw"
  });
  io.to("user:" + u.id).emit("me", publicUser(u));

  setTimeout(() => {
    const live = findUser(u.id);
    if (!live) return;
    const row = live.withdraws.find(x => x.id === wd.id);
    if (row && row.status === "pending") {
      row.status = "paid";
      saveDb();
      io.to("user:" + live.id).emit("me", publicUser(live));
      io.to("user:" + live.id).emit("paid", { amount, method: m });
      io.emit("stats", stats());
    }
  }, 4000);

  res.json({ user: publicUser(u) });
});

app.use(express.static(path.join(__dirname, "site")));
app.get("*", (req, res, next) => {
  if (req.path.startsWith("/api") || req.path.startsWith("/socket.io")) return next();
  res.sendFile(path.join(__dirname, "site", "index.html"));
});

const server = http.createServer(app);
io = new Server(server, {
  cors: { origin: true },
  transports: ["polling", "websocket"]
});

io.on("connection", socket => {
  io.emit("stats", stats());
  socket.on("auth", token => {
    const s = db.sessions[token];
    if (s && s.exp > Date.now()) socket.join("user:" + s.userId);
  });
  socket.on("disconnect", () => io.emit("stats", stats()));
});

server.listen(PORT, HOST, () => {
  console.log(`EasySell BD running on http://${HOST}:${PORT}`);
});
