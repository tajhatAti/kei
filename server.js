const fs = require("fs");
const path = require("path");
const http = require("http");
const crypto = require("crypto");
const express = require("express");
const bcrypt = require("bcryptjs");
const { Server } = require("socket.io");

let io;
const PORT = process.env.PORT || 8080;
const HOST = "0.0.0.0";
const DATA_DIR = path.join(__dirname, "data");
const DB_FILE = path.join(DATA_DIR, "db.json");
const AVATARS = ["/assets/img/avatar-1.jpg", "/assets/img/avatar-2.jpg", "/assets/img/avatar-3.jpg", "/assets/img/avatar-4.jpg"];

function todayKey() { return new Date().toISOString().slice(0, 10); }
function uid(n = 8) { return crypto.randomBytes(n).toString("hex").slice(0, n).toUpperCase(); }
function normPhone(phone) { return String(phone || "").replace(/\D/g, "").replace(/^0+/, ""); }
function now() { return Date.now(); }

function publicUser(u) {
  if (!u) return null;
  const { passHash, totpSecret, ...rest } = u;
  return rest;
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
    microDone: [],
    jobsDone: [],
    typingDoneOn: "",
    refs: 3,
    code: "EASY320",
    referredBy: null,
    activated: true,
    banned: false,
    totp: false,
    seenPopup: false,
    salary: null,
    targetsClaimed: [],
    activity: [
      { t: "জয়েনিং বোনাস", a: 50, at: now() - 86400000 * 4 },
      { t: "ওয়েবসাইট ভিজিট", a: 3, at: now() - 3600000 },
      { t: "উইথড্র · bKash", a: -200, at: now() - 7200000 }
    ],
    withdraws: [{ id: "W1", method: "bKash", amount: 200, wallet: "01700000000", status: "paid", at: now() - 7200000 }],
    createdAt: now() - 86400000 * 4
  };
  return {
    settings: {
      siteName: "EasySell BD",
      joiningBonus: 50,
      refBonus: 20,
      minWithdraw: 100,
      activationFee: 100,
      popup: { on: true, title: "জয়েনিং বোনাস ৳৫০", body: "আজই কাজ শুরু করুন। অ্যাকাউন্ট অ্যাক্টিভেট করলে উইথড্র আনলক হবে।" }
    },
    admin: { user: "admin", passHash: bcrypt.hashSync("admin123", 10) },
    users: [demo],
    sessions: {},
    adminSessions: {},
    ticker: [
      { name: "রাকিব হোসেন", amount: 350, method: "bKash", img: AVATARS[0], at: now() - 60000 },
      { name: "সুমাইয়া আক্তার", amount: 180, method: "Nagad", img: AVATARS[1], at: now() - 120000 },
      { name: "মাহমুদুল হাসান", amount: 500, method: "Rocket", img: AVATARS[2], at: now() - 180000 },
      { name: "নুসরাত জাহান", amount: 220, method: "bKash", img: AVATARS[3], at: now() - 240000 }
    ],
    tasks: [
      { id: "t1", icon: "👍", reward: 5, titleBn: "ফেসবুক পেজ লাইক করুন", titleEn: "Like a Facebook page", descBn: "পেজে লাইক দিয়ে জমা দিন।", descEn: "Like the page and submit.", on: true },
      { id: "t2", icon: "▶️", reward: 8, titleBn: "ইউটিউব ভিডিও দেখুন", titleEn: "Watch a YouTube video", descBn: "৩০ সেকেন্ড দেখুন।", descEn: "Watch 30 seconds.", on: true },
      { id: "t3", icon: "⭐", reward: 12, titleBn: "অ্যাপ রিভিউ দিন", titleEn: "Write an app review", descBn: "৫ তারকা রিভিউ।", descEn: "Leave a 5-star review.", on: true },
      { id: "t4", icon: "📋", reward: 15, titleBn: "ছোট সার্ভে পূরণ করুন", titleEn: "Complete a short survey", descBn: "৫টি প্রশ্ন।", descEn: "Answer 5 questions.", on: true },
      { id: "t5", icon: "🌐", reward: 3, titleBn: "ওয়েবসাইট ভিজিট করুন", titleEn: "Visit a website", descBn: "২০ সেকেন্ড থাকুন।", descEn: "Stay 20 seconds.", on: true },
      { id: "t6", icon: "📲", reward: 20, titleBn: "অ্যাপ ইনস্টল করুন", titleEn: "Install an app", descBn: "ইনস্টল করে ওপেন।", descEn: "Install and open.", on: true },
      { id: "t7", icon: "💬", reward: 7, titleBn: "পোস্টে কমেন্ট করুন", titleEn: "Comment on a post", descBn: "ইতিবাচক কমেন্ট।", descEn: "Leave a positive comment.", on: true },
      { id: "t8", icon: "🎯", reward: 25, titleBn: "অফার ক্লেইম করুন", titleEn: "Claim a partner offer", descBn: "পার্টনার অফার।", descEn: "Claim partner offer.", on: true }
    ],
    microJobs: [
      { id: "m1", title: "পেজ ফলো করুন", reward: 6, slots: 40, on: true },
      { id: "m2", title: "ইনস্টাগ্রাম ফলো", reward: 8, slots: 25, on: true },
      { id: "m3", title: "গ্রুপে জয়েন", reward: 10, slots: 15, on: true }
    ],
    typingJobs: [
      { id: "ty1", text: "EasySell BD te kaj kore online income korun.", reward: 4, on: true },
      { id: "ty2", text: "bKash Nagad Rocket Binance e instant withdraw.", reward: 5, on: true }
    ],
    jobPosts: [
      { id: "j1", title: "ডেটা এন্ট্রি — ৫০ রো", reward: 30, on: true },
      { id: "j2", title: "প্রোডাক্ট রিভিউ লিখুন", reward: 18, on: true }
    ],
    salaryPlans: [
      { id: "s1", name: "বেসিক", price: 200, daily: 10, days: 30 },
      { id: "s2", name: "প্রো", price: 500, daily: 28, days: 30 },
      { id: "s3", name: "ভিআইপি", price: 1000, daily: 60, days: 30 }
    ],
    targets: [
      { id: "g1", title: "৫টা কাজ শেষ করুন", need: 5, reward: 25 },
      { id: "g2", title: "১০টা কাজ শেষ করুন", need: 10, reward: 70 }
    ],
    gifts: [{ code: "EASY50", amount: 50, uses: 20, usedBy: [] }],
    methods: [
      { id: "bkash", name: "bKash", on: true },
      { id: "nagad", name: "Nagad", on: true },
      { id: "rocket", name: "Rocket", on: true },
      { id: "binance", name: "Binance", on: true }
    ],
    activations: [],
    tickets: [],
    reports: []
  };
}

function loadDb() {
  try { return JSON.parse(fs.readFileSync(DB_FILE, "utf8")); } catch { return null; }
}
function saveDb() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
}
function mergeSeed(raw) {
  const s = seedDb();
  if (!raw) return s;
  const out = { ...s, ...raw };
  for (const k of Object.keys(s)) {
    if (out[k] == null) out[k] = s[k];
  }
  out.settings = { ...s.settings, ...(raw.settings || {}) };
  out.settings.popup = { ...s.settings.popup, ...(raw.settings && raw.settings.popup || {}) };
  (out.users || []).forEach(u => {
    u.activated = u.activated !== false;
    u.banned = !!u.banned;
    u.microDone = u.microDone || [];
    u.jobsDone = u.jobsDone || [];
    u.targetsClaimed = u.targetsClaimed || [];
    u.totp = !!u.totp;
    u.seenPopup = !!u.seenPopup;
    u.typingDoneOn = u.typingDoneOn || "";
  });
  return out;
}

let db = mergeSeed(loadDb());
saveDb();

function findUserByPhone(phone) {
  const p = normPhone(phone);
  return db.users.find(u => u.phone === p || u.phone === phone);
}
function findUser(id) { return db.users.find(u => u.id === id); }
function resetToday(u) {
  if (!u) return;
  if (u.todayDate !== todayKey()) {
    u.today = 0;
    u.todayDate = todayKey();
  }
  if (u.salary && u.salary.daysLeft > 0 && u.salary.lastPay !== todayKey()) {
    u.balance += u.salary.daily;
    u.today += u.salary.daily;
    u.earned += u.salary.daily;
    u.salary.daysLeft -= 1;
    u.salary.lastPay = todayKey();
    u.activity.unshift({ t: "মাসিক সেলারি", a: u.salary.daily, at: now() });
  }
}
function credit(u, amount, title) {
  resetToday(u);
  u.balance += amount;
  u.today += amount;
  if (amount > 0) u.earned += amount;
  u.activity.unshift({ t: title, a: amount, at: now() });
}
function createSession(map, userId) {
  const token = crypto.randomBytes(24).toString("hex");
  map[token] = { userId, exp: now() + 1000 * 60 * 60 * 24 * 30 };
  saveDb();
  return token;
}
function authUser(req) {
  const h = req.headers.authorization || "";
  const token = h.startsWith("Bearer ") ? h.slice(7) : "";
  const s = db.sessions[token];
  if (!s || s.exp < now()) return null;
  const u = findUser(s.userId);
  if (!u || u.banned) return null;
  resetToday(u);
  return u;
}
function authAdmin(req) {
  const h = req.headers.authorization || "";
  const token = h.startsWith("Bearer ") ? h.slice(7) : "";
  const s = db.adminSessions[token];
  return s && s.exp > now() ? s : null;
}
function stats() {
  const paid = db.users.reduce((sum, u) => sum + (u.withdraws || []).filter(w => w.status === "paid").reduce((s, w) => s + w.amount, 0), 0);
  return { users: db.users.length, paid, online: io ? io.engine.clientsCount : 0, rating: "4.9" };
}
function pushTicker(item) {
  db.ticker.unshift(item);
  db.ticker = db.ticker.slice(0, 40);
  saveDb();
  if (io) {
    io.emit("ticker", item);
    io.emit("stats", stats());
  }
}
function catalog() {
  return {
    tasks: db.tasks.filter(x => x.on !== false),
    microJobs: db.microJobs.filter(x => x.on !== false),
    typingJobs: db.typingJobs.filter(x => x.on !== false),
    jobPosts: db.jobPosts.filter(x => x.on !== false),
    salaryPlans: db.salaryPlans,
    targets: db.targets,
    methods: db.methods.filter(x => x.on !== false),
    settings: {
      minWithdraw: db.settings.minWithdraw,
      activationFee: db.settings.activationFee,
      popup: db.settings.popup,
      siteName: db.settings.siteName
    }
  };
}

const app = express();
app.disable("x-powered-by");
app.use(express.json({ limit: "64kb" }));

function fail(res, code, error) { return res.status(code).json({ error }); }

app.get("/api/health", (_req, res) => res.json({ ok: true }));
app.get("/api/public", (_req, res) => res.json({ ...stats(), ticker: db.ticker.slice(0, 12) }));
app.get("/api/catalog", (_req, res) => res.json(catalog()));
app.get("/api/leaderboard", (_req, res) => {
  const list = [...db.users].filter(u => !u.banned).sort((a, b) => b.earned - a.earned).slice(0, 20)
    .map((u, i) => ({ rank: i + 1, name: u.name, earned: u.earned, country: u.country }));
  res.json({ list });
});

app.post("/api/register", (req, res) => {
  const { name, phone, dial, country, pass, ref } = req.body || {};
  if (!String(name || "").trim()) return fail(res, 400, "errName");
  const p = normPhone(phone);
  if (p.length < 7) return fail(res, 400, "errPhone");
  if (!pass || String(pass).length < 6) return fail(res, 400, "errPass");
  if (findUserByPhone(p)) return fail(res, 400, "errExists");
  const bonus = db.settings.joiningBonus;
  const u = {
    id: uid(10), name: String(name).trim().slice(0, 40), phone: p,
    dial: String(dial || "+880").slice(0, 8), country: String(country || "bd").slice(0, 4),
    passHash: bcrypt.hashSync(String(pass), 10),
    balance: bonus, today: bonus, todayDate: todayKey(), earned: bonus,
    tasksDone: [], microDone: [], jobsDone: [], typingDoneOn: "",
    refs: 0, code: "ES" + uid(5), referredBy: null, activated: false, banned: false,
    totp: false, seenPopup: false, salary: null, targetsClaimed: [],
    activity: [{ t: "জয়েনিং বোনাস", a: bonus, at: now() }], withdraws: [], createdAt: now()
  };
  const referrer = db.users.find(x => x.code === String(ref || "").toUpperCase());
  if (referrer && referrer.id !== u.id) {
    u.referredBy = referrer.id;
    referrer.refs += 1;
    credit(referrer, db.settings.refBonus, "রেফার বোনাস");
    if (io) io.to("user:" + referrer.id).emit("me", publicUser(referrer));
  }
  db.users.push(u);
  const token = createSession(db.sessions, u.id);
  saveDb();
  pushTicker({ name: u.name, amount: bonus, method: "Bonus", img: AVATARS[db.users.length % AVATARS.length], at: now(), kind: "join" });
  res.json({ token, user: publicUser(u) });
});

app.post("/api/login", (req, res) => {
  const { phone, pass } = req.body || {};
  const u = findUserByPhone(phone);
  if (!u || u.banned || !bcrypt.compareSync(String(pass || ""), u.passHash)) return fail(res, 401, "errCred");
  resetToday(u); saveDb();
  res.json({ token: createSession(db.sessions, u.id), user: publicUser(u) });
});

app.get("/api/me", (req, res) => {
  const u = authUser(req);
  if (!u) return fail(res, 401, "needLogin");
  saveDb();
  res.json({ user: publicUser(u), catalog: catalog() });
});

app.post("/api/popup/seen", (req, res) => {
  const u = authUser(req);
  if (!u) return fail(res, 401, "needLogin");
  u.seenPopup = true; saveDb();
  res.json({ user: publicUser(u) });
});

app.post("/api/tasks/:id/complete", (req, res) => {
  const u = authUser(req);
  if (!u) return fail(res, 401, "needLogin");
  const task = db.tasks.find(x => x.id === req.params.id && x.on !== false);
  if (!task) return fail(res, 400, "errTask");
  if (u.tasksDone.includes(task.id)) return fail(res, 400, "errTask");
  credit(u, task.reward, task.titleBn);
  u.tasksDone.push(task.id);
  saveDb();
  if (io) { io.to("user:" + u.id).emit("me", publicUser(u)); io.emit("stats", stats()); }
  res.json({ user: publicUser(u), reward: task.reward });
});

app.post("/api/micro/:id/do", (req, res) => {
  const u = authUser(req);
  if (!u) return fail(res, 401, "needLogin");
  const job = db.microJobs.find(x => x.id === req.params.id && x.on !== false);
  if (!job) return fail(res, 400, "errTask");
  if (u.microDone.includes(job.id)) return fail(res, 400, "errTask");
  if (job.slots <= 0) return fail(res, 400, "errTask");
  job.slots -= 1;
  u.microDone.push(job.id);
  credit(u, job.reward, "মাইক্রো জব · " + job.title);
  saveDb();
  res.json({ user: publicUser(u), reward: job.reward });
});

app.post("/api/jobs/:id/do", (req, res) => {
  const u = authUser(req);
  if (!u) return fail(res, 401, "needLogin");
  const job = db.jobPosts.find(x => x.id === req.params.id && x.on !== false);
  if (!job) return fail(res, 400, "errTask");
  if (u.jobsDone.includes(job.id)) return fail(res, 400, "errTask");
  u.jobsDone.push(job.id);
  credit(u, job.reward, "জব পোস্ট · " + job.title);
  saveDb();
  res.json({ user: publicUser(u), reward: job.reward });
});

app.post("/api/typing/complete", (req, res) => {
  const u = authUser(req);
  if (!u) return fail(res, 401, "needLogin");
  if (u.typingDoneOn === todayKey()) return fail(res, 400, "errTask");
  const job = db.typingJobs.find(x => x.on !== false);
  if (!job) return fail(res, 400, "errTask");
  const typed = String(req.body?.text || "").trim();
  if (typed !== job.text) return fail(res, 400, "errType");
  u.typingDoneOn = todayKey();
  credit(u, job.reward, "টাইপিং জব");
  saveDb();
  res.json({ user: publicUser(u), reward: job.reward });
});

app.post("/api/salary/:id/buy", (req, res) => {
  const u = authUser(req);
  if (!u) return fail(res, 401, "needLogin");
  const plan = db.salaryPlans.find(x => x.id === req.params.id);
  if (!plan) return fail(res, 400, "errTask");
  if (u.salary && u.salary.daysLeft > 0) return fail(res, 400, "errTask");
  if (u.balance < plan.price) return fail(res, 400, "errBal");
  credit(u, -plan.price, "সেলারি প্ল্যান · " + plan.name);
  u.salary = { planId: plan.id, name: plan.name, daily: plan.daily, daysLeft: plan.days, lastPay: "" };
  saveDb();
  res.json({ user: publicUser(u) });
});

app.post("/api/target/:id/claim", (req, res) => {
  const u = authUser(req);
  if (!u) return fail(res, 401, "needLogin");
  const g = db.targets.find(x => x.id === req.params.id);
  if (!g) return fail(res, 400, "errTask");
  if (u.targetsClaimed.includes(g.id)) return fail(res, 400, "errTask");
  if ((u.tasksDone || []).length < g.need) return fail(res, 400, "errTask");
  u.targetsClaimed.push(g.id);
  credit(u, g.reward, "টার্গেট বোনাস · " + g.title);
  saveDb();
  res.json({ user: publicUser(u), reward: g.reward });
});

app.post("/api/gift", (req, res) => {
  const u = authUser(req);
  if (!u) return fail(res, 401, "needLogin");
  const code = String(req.body?.code || "").trim().toUpperCase();
  const g = db.gifts.find(x => x.code === code);
  if (!g) return fail(res, 400, "errCred");
  if (g.usedBy.includes(u.id) || g.usedBy.length >= g.uses) return fail(res, 400, "errTask");
  g.usedBy.push(u.id);
  credit(u, g.amount, "গিফট কোড · " + g.code);
  saveDb();
  res.json({ user: publicUser(u), reward: g.amount });
});

app.post("/api/activate", (req, res) => {
  const u = authUser(req);
  if (!u) return fail(res, 401, "needLogin");
  if (u.activated) return res.json({ user: publicUser(u) });
  const method = String(req.body?.method || "bKash");
  const trx = String(req.body?.trx || "").trim();
  if (!trx) return fail(res, 400, "errWallet");
  db.activations.unshift({ id: "A" + uid(6), userId: u.id, name: u.name, method, trx, amount: db.settings.activationFee, status: "pending", at: now() });
  u.activity.unshift({ t: "অ্যাক্টিভেশন রিকোয়েস্ট", a: 0, at: now() });
  saveDb();
  res.json({ user: publicUser(u) });
});

app.post("/api/support", (req, res) => {
  const u = authUser(req);
  if (!u) return fail(res, 401, "needLogin");
  const subject = String(req.body?.subject || "").trim();
  const body = String(req.body?.body || "").trim();
  if (!subject || !body) return fail(res, 400, "errName");
  const ticket = { id: "T" + uid(6), userId: u.id, name: u.name, subject, status: "open", msgs: [{ from: "user", text: body, at: now() }] };
  db.tickets.unshift(ticket);
  saveDb();
  res.json({ ticket, tickets: db.tickets.filter(t => t.userId === u.id) });
});

app.get("/api/support", (req, res) => {
  const u = authUser(req);
  if (!u) return fail(res, 401, "needLogin");
  res.json({ tickets: db.tickets.filter(t => t.userId === u.id) });
});

app.post("/api/report", (req, res) => {
  const u = authUser(req);
  if (!u) return fail(res, 401, "needLogin");
  const text = String(req.body?.text || "").trim();
  if (!text) return fail(res, 400, "errName");
  db.reports.unshift({ id: "R" + uid(6), userId: u.id, name: u.name, text, at: now() });
  saveDb();
  res.json({ ok: true });
});

app.get("/api/team", (req, res) => {
  const u = authUser(req);
  if (!u) return fail(res, 401, "needLogin");
  const members = db.users.filter(x => x.referredBy === u.id).map(x => ({ name: x.name, phone: x.phone, earned: x.earned, at: x.createdAt }));
  res.json({ members, code: u.code, refs: u.refs });
});

app.post("/api/totp/toggle", (req, res) => {
  const u = authUser(req);
  if (!u) return fail(res, 401, "needLogin");
  u.totp = !u.totp;
  saveDb();
  res.json({ user: publicUser(u) });
});

app.post("/api/withdraw", (req, res) => {
  const u = authUser(req);
  if (!u) return fail(res, 401, "needLogin");
  if (!u.activated) return fail(res, 400, "errActivate");
  const amount = Number(req.body?.amount);
  const method = String(req.body?.method || "bKash");
  const wallet = String(req.body?.wallet || "").trim();
  if (!amount || amount < db.settings.minWithdraw) return fail(res, 400, "errMin");
  if (amount > u.balance) return fail(res, 400, "errBal");
  if (!wallet) return fail(res, 400, "errWallet");
  const allowed = db.methods.filter(m => m.on !== false).map(m => m.name);
  const m = allowed.includes(method) ? method : (allowed[0] || "bKash");
  credit(u, -amount, `উইথড্র · ${m}`);
  const wd = { id: "W" + uid(6), method: m, amount, wallet, status: "pending", at: now() };
  u.withdraws.unshift(wd);
  saveDb();
  pushTicker({ name: u.name, amount, method: m, img: AVATARS[Math.abs(u.name.length) % AVATARS.length], at: now(), kind: "withdraw" });
  if (io) io.to("user:" + u.id).emit("me", publicUser(u));
  setTimeout(() => {
    const live = findUser(u.id);
    if (!live) return;
    const row = live.withdraws.find(x => x.id === wd.id);
    if (row && row.status === "pending") {
      row.status = "paid";
      saveDb();
      if (io) {
        io.to("user:" + live.id).emit("me", publicUser(live));
        io.to("user:" + live.id).emit("paid", { amount, method: m });
        io.emit("stats", stats());
      }
    }
  }, 4000);
  res.json({ user: publicUser(u) });
});

/* -------- ADMIN -------- */
app.post("/api/admin/login", (req, res) => {
  const { user, pass } = req.body || {};
  if (user !== db.admin.user || !bcrypt.compareSync(String(pass || ""), db.admin.passHash)) return fail(res, 401, "errCred");
  res.json({ token: createSession(db.adminSessions, "admin"), user: db.admin.user });
});

function needAdmin(req, res) {
  const a = authAdmin(req);
  if (!a) { fail(res, 401, "needLogin"); return null; }
  return a;
}

app.get("/api/admin/overview", (req, res) => {
  if (!needAdmin(req, res)) return;
  const pendingWd = db.users.flatMap(u => (u.withdraws || []).filter(w => w.status === "pending"));
  res.json({
    stats: stats(),
    pendingWithdraws: pendingWd.length,
    pendingActivations: db.activations.filter(a => a.status === "pending").length,
    tickets: db.tickets.filter(t => t.status === "open").length,
    users: db.users.length,
    reports: db.reports.length,
    catalog: {
      tasks: db.tasks, microJobs: db.microJobs, typingJobs: db.typingJobs, jobPosts: db.jobPosts,
      salaryPlans: db.salaryPlans, targets: db.targets, gifts: db.gifts, methods: db.methods
    },
    settings: db.settings,
    activations: db.activations,
    ticketsAll: db.tickets,
    reportsAll: db.reports,
    usersAll: db.users.map(publicUser),
    adminUser: db.admin.user
  });
});

app.post("/api/admin/users/:id", (req, res) => {
  if (!needAdmin(req, res)) return;
  const u = findUser(req.params.id);
  if (!u) return fail(res, 404, "errCred");
  const { add, ban, activated } = req.body || {};
  if (typeof add === "number" && add) credit(u, add, "এডমিন অ্যাডজাস্ট");
  if (typeof ban === "boolean") u.banned = ban;
  if (typeof activated === "boolean") u.activated = activated;
  saveDb();
  res.json({ user: publicUser(u) });
});

app.post("/api/admin/withdrawals/:id", (req, res) => {
  if (!needAdmin(req, res)) return;
  const status = req.body?.status === "paid" ? "paid" : "rejected";
  for (const u of db.users) {
    const w = (u.withdraws || []).find(x => x.id === req.params.id);
    if (w) {
      if (status === "rejected" && w.status === "pending") credit(u, w.amount, "উইথড্র রিফান্ড");
      w.status = status;
      saveDb();
      return res.json({ ok: true });
    }
  }
  fail(res, 404, "errTask");
});

app.post("/api/admin/activations/:id", (req, res) => {
  if (!needAdmin(req, res)) return;
  const row = db.activations.find(a => a.id === req.params.id);
  if (!row) return fail(res, 404, "errTask");
  row.status = req.body?.status === "approved" ? "approved" : "rejected";
  const u = findUser(row.userId);
  if (u && row.status === "approved") {
    u.activated = true;
    u.activity.unshift({ t: "অ্যাকাউন্ট অ্যাক্টিভ", a: 0, at: now() });
  }
  saveDb();
  res.json({ ok: true });
});

app.post("/api/admin/settings", (req, res) => {
  if (!needAdmin(req, res)) return;
  const s = req.body || {};
  ["joiningBonus", "refBonus", "minWithdraw", "activationFee", "siteName"].forEach(k => {
    if (s[k] != null) db.settings[k] = k === "siteName" ? String(s[k]) : Number(s[k]);
  });
  if (s.popup) db.settings.popup = { ...db.settings.popup, ...s.popup };
  saveDb();
  res.json({ settings: db.settings });
});

app.post("/api/admin/account", (req, res) => {
  if (!needAdmin(req, res)) return;
  if (req.body?.user) db.admin.user = String(req.body.user).slice(0, 30);
  if (req.body?.pass && String(req.body.pass).length >= 6) db.admin.passHash = bcrypt.hashSync(String(req.body.pass), 10);
  saveDb();
  res.json({ user: db.admin.user });
});

app.post("/api/admin/tickets/:id/reply", (req, res) => {
  if (!needAdmin(req, res)) return;
  const t = db.tickets.find(x => x.id === req.params.id);
  if (!t) return fail(res, 404, "errTask");
  t.msgs.push({ from: "admin", text: String(req.body?.text || ""), at: now() });
  if (req.body?.close) t.status = "closed";
  saveDb();
  res.json({ ticket: t });
});

app.post("/api/admin/save-col", (req, res) => {
  if (!needAdmin(req, res)) return;
  const { col, items } = req.body || {};
  const allowed = ["tasks", "microJobs", "typingJobs", "jobPosts", "salaryPlans", "targets", "gifts", "methods"];
  if (!allowed.includes(col) || !Array.isArray(items)) return fail(res, 400, "errTask");
  db[col] = items;
  saveDb();
  res.json({ ok: true, items: db[col] });
});

app.get("/api/admin/export.csv", (req, res) => {
  if (!needAdmin(req, res)) return;
  const lines = ["id,name,phone,balance,earned,activated,refs,createdAt"];
  db.users.forEach(u => lines.push([u.id, u.name, u.dial + u.phone, u.balance, u.earned, u.activated, u.refs, u.createdAt].join(",")));
  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", "attachment; filename=users.csv");
  res.send(lines.join("\n"));
});

app.use(express.static(path.join(__dirname, "site")));
app.get("*", (req, res, next) => {
  if (req.path.startsWith("/api") || req.path.startsWith("/socket.io")) return next();
  res.sendFile(path.join(__dirname, "site", "index.html"));
});

const server = http.createServer(app);
io = new Server(server, { cors: { origin: true }, transports: ["polling", "websocket"] });
io.on("connection", socket => {
  io.emit("stats", stats());
  socket.on("auth", token => {
    const s = db.sessions[token];
    if (s && s.exp > now()) socket.join("user:" + s.userId);
  });
  socket.on("disconnect", () => io.emit("stats", stats()));
});
server.listen(PORT, HOST, () => console.log(`EasySell BD running on http://${HOST}:${PORT}`));
