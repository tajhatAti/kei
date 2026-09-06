(() => {
  const $ = (sel, el = document) => el.querySelector(sel);
  const app = $("#app");
  const toastBox = $("#toast");
  const store = {
    get(k, d) { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } },
    set(k, v) { localStorage.setItem(k, JSON.stringify(v)); }
  };

  const state = {
    lang: store.get("es_lang", "bn"),
    token: store.get("es_token", null),
    adminToken: store.get("es_admin", null),
    user: null,
    admin: null,
    country: ES.COUNTRIES[0],
    countryOpen: false,
    countryQ: "",
    form: { name: "", phone: "", pass: "", cpass: "", adminUser: "", adminPass: "", gift: "", trx: "", typeText: "", subj: "", body: "", report: "", reply: "", addBal: "" },
    doing: null,
    progress: 0,
    wdMethod: "bKash",
    wdAmount: "",
    wdWallet: "",
    live: { users: 0, paid: 0, online: 0, ticker: [] },
    catalog: { tasks: ES.TASKS, microJobs: [], typingJobs: [], jobPosts: [], salaryPlans: [], targets: [], methods: [], settings: { minWithdraw: 100, activationFee: 100, popup: { on: false } } },
    extra: { tickets: [], team: [], board: [], overview: null },
    popup: false,
    busy: false
  };

  const t = k => (ES.I18N[state.lang] && ES.I18N[state.lang][k]) || k;
  const money = n => "৳" + Number(n || 0).toLocaleString("en-BD");
  const flag = code => `https://flagcdn.com/w40/${code}.png`;
  const initials = name => (name || "U").trim().split(/\s+/).slice(0, 2).map(s => s[0]).join("").toUpperCase();
  const current = () => state.user;
  function route() {
    let h = location.hash.replace(/^#/, "") || "/";
    let scroll = null;
    if (!h.startsWith("/")) { scroll = h; h = "/"; }
    else if (h.includes("#")) { const p = h.split("#"); h = p[0] || "/"; scroll = p[1]; }
    return { path: (h.split("?")[0] || "/"), scroll };
  }
  const go = path => { location.hash = path; };
  const refCode = () => new URLSearchParams(location.hash.split("?")[1] || "").get("ref") || "";

  async function api(path, opts = {}, token) {
    const headers = { "Content-Type": "application/json", ...(opts.headers || {}) };
    const tok = token === undefined ? state.token : token;
    if (tok) headers.Authorization = "Bearer " + tok;
    const res = await fetch(path, { ...opts, headers });
    if (path.endsWith(".csv")) return res;
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const key = data.error || "errCred";
      throw new Error(t(key) !== key ? t(key) : key);
    }
    return data;
  }
  function toast(msg, err) {
    const el = document.createElement("div");
    el.className = "toast" + (err ? " err" : "");
    el.textContent = msg;
    toastBox.appendChild(el);
    setTimeout(() => el.remove(), 2800);
  }

  const I = {
    home: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1z"/></svg>`,
    work: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="4" width="16" height="16" rx="3"/><path d="M8 12l2.5 2.5L16 9"/></svg>`,
    team: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="8" r="3"/><path d="M4 19a5 5 0 0 1 10 0"/><path d="M16 11h5M18.5 8.5v5"/></svg>`,
    wd: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 4v12M7 11l5 5 5-5"/><path d="M5 20h14"/></svg>`,
    menu: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 7h14M5 12h14M5 17h14"/></svg>`
  };

  const MENU = [
    ["⚡", "কাজ", "Work", "/app/work"],
    ["🧩", "মাইক্রো জব", "Micro", "/app/micro"],
    ["⌨️", "টাইপিং", "Typing", "/app/typing"],
    ["💼", "জব পোস্ট", "Jobs", "/app/jobs"],
    ["📅", "মাসিক সেলারি", "Salary", "/app/salary"],
    ["🎯", "টার্গেট", "Target", "/app/target"],
    ["🎁", "গিফট", "Gift", "/app/gift"],
    ["👥", "টিম", "Team", "/app/team"],
    ["🏆", "লিডারবোর্ড", "Board", "/app/board"],
    ["💬", "সাপোর্ট", "Support", "/app/support"],
    ["🚩", "রিপোর্ট", "Report", "/app/report"],
    ["✅", "অ্যাক্টিভেট", "Activate", "/app/activate"],
    ["📜", "হিস্ট্রি", "History", "/app/history"],
    ["📊", "স্ট্যাটস", "Stats", "/app/stats"],
    ["👤", "প্রোফাইল", "Profile", "/app/profile"],
    ["💵", "উইথড্র", "Withdraw", "/app/withdraw"]
  ];

  function tickerHtml() {
    const items = state.live.ticker || [];
    const loop = items.length ? [...items, ...items] : [];
    return loop.map(x => {
      const img = (x.img || "/assets/img/avatar-1.jpg").replace(/^assets/, "/assets");
      return `<div class="tick"><img src="${img}" alt=""><span>${x.name}</span><b>${money(x.amount)}</b><span>${x.method}</span></div>`;
    }).join("");
  }

  function nav() {
    const u = current();
    return `
      <nav class="nav">
        <a class="brand" href="#/">
          <img src="assets/img/logo.png" alt="EasySell">
          <div>EasySell BD<small>${t("tagline")}</small></div>
        </a>
        <div class="nav-links">
          <a href="#/#why">${t("navWhy")}</a>
          <a href="#/#how">${t("navHow")}</a>
          <a href="#/#pay">${t("navPay")}</a>
          <a href="#/admin/login">Admin</a>
        </div>
        <div class="nav-right">
          <span class="live-pill"><i></i> ${state.live.online || 0} ${t("liveNow")}</span>
          <button class="lang-btn" data-act="lang">${t("lang")}</button>
          ${u ? `<a class="btn sm" href="#/app">${t("dash")}</a>` : `<a class="ghost-btn" href="#/login">${t("login")}</a><a class="btn sm" href="#/register">${t("register")}</a>`}
        </div>
      </nav>`;
  }

  function landing() {
    const features = [
      ["⚡", "f1t", "f1d", "Simple Tasks"], ["💎", "f2t", "f2d", "Instant Rewards"],
      ["🎯", "f3t", "f3d", "Referral Bonus"], ["💵", "f4t", "f4d", "Fast Withdrawal"],
      ["📱", "f5t", "f5d", "24/7 Support"], ["🏆", "f6t", "f6d", "100% Secure"]
    ].map(([ico, tk, dk, en]) => `<article class="card"><div class="ico">${ico}</div><h3>${t(tk)}<span class="en-sub">${en}</span></h3><p>${t(dk)}</p></article>`).join("");
    return `
      ${nav()}
      <div class="wrap">
        <section class="hero">
          <div>
            <div class="badge"><i>৳</i> ${t("heroBadge")}</div>
            <h1>${t("heroTitle1")}<br>${t("heroTitle2")}<br><em>${t("heroTitle3")}</em></h1>
            <p class="lead">${t("heroSub")}</p>
            <div class="hero-actions">
              <a class="btn lg" href="#/register">${t("heroCta")}</a>
              <a class="btn lg ghost" href="#/#how">${t("heroGhost")}</a>
            </div>
            <div class="stats">
              <div class="stat"><b id="st-users">${state.live.users || 0}</b><span>${t("statUsers")}</span></div>
              <div class="stat"><b id="st-paid">${money(state.live.paid || 0)}</b><span>${t("statPaid")}</span></div>
              <div class="stat"><b>4.9 ★</b><span>${t("statRate")}</span></div>
            </div>
          </div>
          <div class="hero-visual">
            <img class="phone" src="assets/img/hero-phone.jpg" alt="">
            <div class="float-chip chip-a"><img src="assets/img/avatar-2.jpg" alt=""><div>সুমাইয়া · চট্টগ্রাম<br><b>+ ${money(180)} Nagad</b></div></div>
            <div class="float-chip chip-b"><img src="assets/img/avatar-1.jpg" alt=""><div>রাকিব · ঢাকা<br><b>+ ${money(350)} bKash</b></div></div>
          </div>
        </section>
      </div>
      <div class="ticker-wrap"><div class="ticker" id="live-ticker">${tickerHtml()}</div></div>
      <div class="wrap">
        <section id="why"><div class="sec-head"><h2>${t("whyTitle")}</h2><p>${t("whySub")}</p></div><div class="grid-3">${features}</div></section>
        <section id="how"><div class="sec-head"><h2>${t("howTitle")}</h2><p>${t("howSub")}</p></div>
          <div class="steps">
            <div class="step"><div class="num">১</div><div><h3>${t("s1t")}</h3><p>${t("s1d")}</p></div></div>
            <div class="step"><div class="num">২</div><div><h3>${t("s2t")}</h3><p>${t("s2d")}</p></div></div>
            <div class="step"><div class="num">৩</div><div><h3>${t("s3t")}</h3><p>${t("s3d")}</p></div></div>
          </div>
        </section>
        <section id="pay"><div class="sec-head"><h2>${t("payTitle")}</h2><p>${t("paySub")}</p></div>
          <div class="pays">
            <div class="pay bkash"><span>Mobile wallet</span><b>bKash</b></div>
            <div class="pay nagad"><span>Mobile wallet</span><b>Nagad</b></div>
            <div class="pay rocket"><span>Dutch-Bangla</span><b>Rocket</b></div>
            <div class="pay binance"><span>Crypto</span><b>Binance</b></div>
          </div>
        </section>
        <section>
          <div class="cta-band">
            <img class="burst" src="assets/img/coin-burst.jpg" alt="">
            <h2>${t("ctaTitle")}</h2><p>${t("ctaSub")}</p>
            <a class="btn lg gold" href="#/register">${t("ctaBtn")}</a>
          </div>
        </section>
      </div>
      <footer class="site">${t("foot")} · <a href="#/admin/login">Admin</a></footer>`;
  }

  function countrySheet() {
    const q = state.countryQ.toLowerCase();
    const list = ES.COUNTRIES.filter(c => !q || c.name.toLowerCase().includes(q) || c.nameBn.includes(q) || c.dial.includes(q) || c.code.includes(q));
    return `<div class="overlay" data-act="close-sheet"><div class="sheet" onclick="event.stopPropagation()">
      <div style="display:flex;justify-content:space-between;align-items:center"><h3>${t("pickCountry")}</h3><button class="ghost-btn" data-act="close-sheet">${t("close")}</button></div>
      <input class="search" id="cq" placeholder="${t("search")}" value="${state.countryQ}">
      <div class="clist">${list.map(c => `<button class="crow ${c.code === state.country.code ? "active" : ""}" data-act="pick-cc" data-code="${c.code}">
        <img src="${flag(c.code)}" alt=""><div>${state.lang === "bn" ? c.nameBn : c.name}<small style="display:block;color:var(--muted)">${c.name}</small></div><small>${c.dial}</small>
      </button>`).join("")}</div>
    </div></div>`;
  }
  function phoneField() {
    const c = state.country;
    return `<div class="field"><label>${t("mobile")} · ${t("countriesN")}</label>
      <div class="phone-row">
        <button type="button" class="cc-btn" data-act="open-cc"><img src="${flag(c.code)}" alt=""><span>${c.dial}</span> ▾</button>
        <input id="phone" inputmode="numeric" value="${state.form.phone}">
      </div>
      <div class="preview">${c.dial} ${state.form.phone}</div>
      <div class="hint">${t("fullNum")}</div></div>`;
  }
  function authLayout(kind) {
    const isReg = kind === "register";
    const isAdmin = kind === "admin";
    return `<div class="auth-page">
      <aside class="auth-side">
        <a class="brand" href="#/"><img src="assets/img/logo.png" alt=""><div>EasySell BD<small>${isAdmin ? "Admin Control" : t("tagline")}</small></div></a>
        <div><div class="quote">${isAdmin ? "এডমিন কন্ট্রোল" : t("heroTitle1")}<br>${isAdmin ? "সুরক্ষিত প্যানেল" : t("heroTitle2")}</div></div>
        <img src="assets/img/hero-phone.jpg" alt="" style="width:min(360px,100%);opacity:.9">
      </aside>
      <main class="auth-main">
        <div style="display:flex;justify-content:space-between"><a class="ghost-btn" href="#/">${t("back")}</a><button class="lang-btn" data-act="lang">${t("lang")}</button></div>
        <div class="auth-card">
          <h1>${isAdmin ? "এডমিন লগইন" : isReg ? t("doReg") : t("doLog")}</h1>
          <p class="world">${isAdmin ? "শুধুমাত্র অনুমোদিত এডমিনদের জন্য" : isReg ? t("worldReg") : t("worldLog")}</p>
          ${isAdmin ? `<form data-act="admin-login">
            <div class="field"><label>এডমিন ইউজার</label><input id="adminUser" value="${state.form.adminUser}"></div>
            <div class="field"><label>এডমিন পাসওয়ার্ড</label><input id="adminPass" type="password" value="${state.form.adminPass}"></div>
            <button class="btn block lg" type="submit">কন্ট্রোল প্যানেলে প্রবেশ করুন</button>
            <p class="demo">admin / admin123</p>
          </form>` : `<form data-act="${isReg ? "register" : "login"}">
            ${isReg ? `<div class="field"><label>${t("name")}</label><input id="name" value="${state.form.name}"></div>` : ""}
            ${phoneField()}
            <div class="field"><label>${t("pass")}</label><input id="pass" type="password" value="${state.form.pass}"></div>
            ${isReg ? `<div class="field"><label>${t("cpass")}</label><input id="cpass" type="password" value="${state.form.cpass}"></div>` : ""}
            <button class="btn block lg" type="submit">${isReg ? t("doReg") : t("doLog")}</button>
          </form>
          <p class="switch">${isReg ? t("haveAcc") + ' <a href="#/login">' + t("goLogin") + "</a>" : t("noAcc") + ' <a href="#/register">' + t("goReg") + "</a>"}</p>
          <p class="demo">${t("demoHint")}</p>`}
        </div>
      </main>
    </div>${state.countryOpen ? countrySheet() : ""}`;
  }

  function bottom(tab) {
    const items = [
      ["home", I.home, t("dash"), "#/app"],
      ["work", I.work, t("tasks"), "#/app/work"],
      ["team", I.team, t("refer"), "#/app/team"],
      ["withdraw", I.wd, t("withdraw"), "#/app/withdraw"],
      ["menu", I.menu, "মেনু", "#/app/menu"]
    ];
    return `<nav class="bottom-nav">${items.map(([k, ico, lab, href]) => `<a class="${tab === k ? "on" : ""}" href="${href}">${ico}<span>${lab}</span></a>`).join("")}</nav>`;
  }
  function appTop(u) {
    return `<div class="app-top"><div class="who"><div class="avatar">${initials(u.name)}</div>
      <div><small>${t("hi")}</small><b>${u.name}</b></div></div>
      <div style="display:flex;gap:8px;align-items:center">
        <span class="live-pill"><i></i> live</span>
        <button class="lang-btn" data-act="lang">${t("lang")}</button>
      </div></div>`;
  }
  function shell(u, tab, inner, extraModal = "") {
    const pop = state.catalog.settings?.popup;
    const showPop = state.popup && pop && pop.on && u && !u.seenPopup;
    return `<div class="app-shell">${appTop(u)}${inner}${bottom(tab)}</div>${extraModal}
      ${showPop ? `<div class="overlay" data-act="seen-popup"><div class="sheet" onclick="event.stopPropagation()">
        <h3>${pop.title || ""}</h3><p style="color:var(--muted);margin:8px 0 16px">${pop.body || ""}</p>
        <button class="btn block" data-act="seen-popup">${t("ok")}</button>
      </div></div>` : ""}`;
  }

  function dashHome(u) {
    return shell(u, "home", `
      <div class="bal-hero">
        <div class="lbl">${t("balance")} ${u.activated ? "" : "· 🔒"}</div>
        <div class="amt">${money(u.balance)}</div>
        <a class="btn gold" href="#/app/withdraw">${t("withdraw")}</a>
      </div>
      <div class="quick">
        <div class="q"><b>${money(u.today || 0)}</b><span>${t("today")}</span></div>
        <div class="q"><b>${(u.tasksDone || []).length}</b><span>${t("done")}</span></div>
        <div class="q"><b>${u.refs || 0}</b><span>${t("refs")}</span></div>
      </div>
      ${!u.activated ? `<div class="notice">উইথড্র করতে অ্যাকাউন্ট <a href="#/app/activate" style="color:var(--gold)">অ্যাক্টিভেট</a> করুন — ফি ${money(state.catalog.settings.activationFee)}.</div>` : ""}
      <div class="section-title"><h3>মেনু</h3></div>
      <div class="menu-grid">${MENU.map(([ico, bn, en, href]) => `<a class="m-item" href="#${href}"><div class="ico">${ico}</div>${state.lang === "bn" ? bn : en}</a>`).join("")}</div>
    `);
  }
  function menuPage(u) {
    return shell(u, "menu", `<div class="section-title" style="padding-top:16px"><h3>সব মডিউল</h3></div>
      <div class="menu-grid">${MENU.map(([ico, bn, en, href]) => `<a class="m-item" href="#${href}"><div class="ico">${ico}</div>${state.lang === "bn" ? bn : en}</a>`).join("")}</div>`);
  }

  function taskRow(task, doneKey = "tasksDone") {
    const title = state.lang === "bn" ? (task.titleBn || task.title) : (task.titleEn || task.title);
    const desc = state.lang === "bn" ? (task.descBn || "") : (task.descEn || "");
    const u = current();
    const done = (u[doneKey] || []).includes(task.id);
    return `<div class="task ${done ? "done" : ""}"><div class="ico">${task.icon || "🧩"}</div>
      <div><h4>${title}</h4><p>${desc || (task.slots != null ? "স্লট " + task.slots : "")}</p></div>
      <div><div class="pay-tag">${money(task.reward)}</div>
        ${done ? `<span class="pill ok">${t("approved")}</span>` : `<button class="btn sm" style="margin-top:6px" data-act="start-task" data-id="${task.id}" data-kind="${doneKey}">${t("startTask")}</button>`}
      </div></div>`;
  }
  function taskModal() {
    if (!state.doing) return "";
    const all = [...(state.catalog.tasks || []), ...(state.catalog.microJobs || []), ...(state.catalog.jobPosts || [])];
    const task = all.find(x => x.id === state.doing);
    if (!task) return "";
    const title = task.titleBn || task.title;
    const ready = state.progress >= 100;
    return `<div class="overlay" data-act="close-task"><div class="sheet" onclick="event.stopPropagation()"><div class="task-modal">
      <div class="big">${task.icon || "⚡"}</div><h3>${title}</h3>
      <div class="bar"><i style="width:${state.progress}%"></i></div>
      <p style="color:var(--gold);font-weight:800;margin-bottom:14px">${t("reward")} ${money(task.reward)}</p>
      <button class="btn block" data-act="finish-task" ${ready ? "" : "disabled"}>${ready ? t("submit") : t("doing")}</button>
    </div></div></div>`;
  }

  function listPage(u, tab, title, rows, modal = "") {
    return shell(u, tab, `<div class="section-title" style="padding-top:16px"><h3>${title}</h3></div><div class="list">${rows || `<div class="empty">${t("empty")}</div>`}</div>`, modal);
  }

  function workPage(u) { return listPage(u, "work", "কাজ / Work", (state.catalog.tasks || []).map(x => taskRow(x, "tasksDone")).join(""), taskModal()); }
  function microPage(u) { return listPage(u, "menu", "মাইক্রো জব", (state.catalog.microJobs || []).map(x => taskRow(x, "microDone")).join(""), taskModal()); }
  function jobsPage(u) { return listPage(u, "menu", "জব পোস্ট", (state.catalog.jobPosts || []).map(x => taskRow(x, "jobsDone")).join(""), taskModal()); }

  function typingPage(u) {
    const job = (state.catalog.typingJobs || [])[0];
    const done = u.typingDoneOn === new Date().toISOString().slice(0, 10);
    return shell(u, "menu", `
      <div class="section-title" style="padding-top:16px"><h3>টাইপিং জব</h3><span>${job ? money(job.reward) : ""}</span></div>
      ${job ? `<div class="typing-box">${job.text}</div>
        <form class="act" data-act="typing">
          <div class="field"><label>এই টেক্সট হুবহু টাইপ করুন</label><textarea id="typeText">${state.form.typeText}</textarea></div>
          <button class="btn block" ${done ? "disabled" : ""}>${done ? t("approved") : t("submit")}</button>
        </form>` : `<div class="empty">${t("empty")}</div>`}`);
  }
  function salaryPage(u) {
    return shell(u, "menu", `<div class="section-title" style="padding-top:16px"><h3>মাসিক সেলারি</h3></div>
      ${u.salary && u.salary.daysLeft > 0 ? `<div class="notice">${u.salary.name} চলছে · বাকি ${u.salary.daysLeft} দিন · প্রতিদিন ${money(u.salary.daily)}</div>` : ""}
      <div class="list">${(state.catalog.salaryPlans || []).map(p => `<div class="task"><div class="ico">📅</div><div><h4>${p.name}</h4><p>${p.days} দিন · দৈনিক ${money(p.daily)}</p></div>
        <div><div class="pay-tag">${money(p.price)}</div><button class="btn sm" style="margin-top:6px" data-act="buy-salary" data-id="${p.id}">কিনুন</button></div></div>`).join("")}</div>`);
  }
  function targetPage(u) {
    return shell(u, "menu", `<div class="section-title" style="padding-top:16px"><h3>টার্গেট বোনাস</h3></div>
      <div class="list">${(state.catalog.targets || []).map(g => {
        const got = (u.targetsClaimed || []).includes(g.id);
        const ready = (u.tasksDone || []).length >= g.need;
        return `<div class="task"><div class="ico">🎯</div><div><h4>${g.title}</h4><p>${(u.tasksDone || []).length}/${g.need} কাজ</p></div>
          <div><div class="pay-tag">${money(g.reward)}</div>${got ? `<span class="pill ok">${t("approved")}</span>` : `<button class="btn sm" style="margin-top:6px" data-act="claim-target" data-id="${g.id}" ${ready ? "" : "disabled"}>ক্লেইম</button>`}</div></div>`;
      }).join("")}</div>`);
  }
  function giftPage(u) {
    return shell(u, "menu", `<div class="section-title" style="padding-top:16px"><h3>গিফট কোড</h3></div>
      <form class="act" data-act="gift"><div class="field"><label>কোড</label><input id="gift" value="${state.form.gift}" placeholder="EASY50"></div>
      <button class="btn block gold">রিডিম</button></form>`);
  }
  function teamPage(u) {
    const link = `${location.origin}${location.pathname}#/register?ref=${u.code}`;
    const members = state.extra.team || [];
    return shell(u, "team", `<div class="ref-box"><div class="lbl">${t("refTitle")}</div><p style="color:var(--muted)">${t("refSub")}</p>
      <div class="code">${u.code}</div>
      <div class="row-btns"><button class="btn sm" data-act="copy" data-text="${u.code}">${t("copy")}</button>
      <button class="btn sm ghost" data-act="copy" data-text="${link}">${t("share")}</button></div></div>
      <div class="quick"><div class="q"><b>${u.refs || 0}</b><span>${t("refs")}</span></div>
        <div class="q"><b>${money((u.refs || 0) * 20)}</b><span>${t("joinBonus")}</span></div>
        <div class="q"><b>${members.length}</b><span>টিম</span></div></div>
      <div class="hist">${members.map(m => `<div class="row"><span>${m.name}</span><b>${money(m.earned)}</b></div>`).join("") || `<div class="empty">${t("empty")}</div>`}</div>`);
  }
  function boardPage(u) {
    return shell(u, "menu", `<div class="section-title" style="padding-top:16px"><h3>লিডারবোর্ড</h3></div>
      <div class="hist">${(state.extra.board || []).map(r => `<div class="row"><span>#${r.rank} ${r.name}</span><b>${money(r.earned)}</b></div>`).join("") || `<div class="empty">${t("empty")}</div>`}</div>`);
  }
  function supportPage(u) {
    return shell(u, "menu", `<div class="section-title" style="padding-top:16px"><h3>সাপোর্ট</h3></div>
      <form class="act" data-act="support">
        <div class="field"><label>বিষয়</label><input id="subj" value="${state.form.subj}"></div>
        <div class="field"><label>মেসেজ</label><textarea id="body">${state.form.body}</textarea></div>
        <button class="btn block">টিকেট খুলুন</button>
      </form>
      <div class="hist">${(state.extra.tickets || []).map(tk => `<div class="row"><div><b>${tk.subject}</b><div style="color:var(--muted);font-size:12px">${tk.msgs.slice(-1)[0].text}</div></div><span class="pill ${tk.status === "open" ? "wait" : "ok"}">${tk.status}</span></div>`).join("")}</div>`);
  }
  function reportPage(u) {
    return shell(u, "menu", `<div class="section-title" style="padding-top:16px"><h3>রিপোর্ট</h3></div>
      <form class="act" data-act="report"><div class="field"><label>সমস্যা লিখুন</label><textarea id="report">${state.form.report}</textarea></div>
      <button class="btn block">পাঠান</button></form>`);
  }
  function activatePage(u) {
    return shell(u, "menu", `<div class="section-title" style="padding-top:16px"><h3>অ্যাকাউন্ট অ্যাক্টিভেট</h3></div>
      ${u.activated ? `<div class="notice">অ্যাকাউন্ট অ্যাক্টিভ ✅ উইথড্র আনলক।</div>` : `
      <div class="notice">ফি ${money(state.catalog.settings.activationFee)} — bKash/Nagad ট্রান্সআইডি দিন, এডমিন এপ্রুভ করবে।</div>
      <form class="act" data-act="activate">
        <div class="field"><label>মেথড</label><select id="actMethod">${(state.catalog.methods || []).map(m => `<option>${m.name}</option>`).join("")}</select></div>
        <div class="field"><label>Trx ID</label><input id="trx" value="${state.form.trx}"></div>
        <button class="btn block gold">রিকোয়েস্ট পাঠান</button>
      </form>`}`);
  }
  function historyPage(u) {
    return shell(u, "menu", `<div class="section-title" style="padding-top:16px"><h3>${t("history")}</h3></div>
      <div class="hist">${(u.activity || []).map(a => `<div class="row"><span>${a.t}</span><b style="color:${a.a >= 0 ? "var(--mint)" : "var(--gold)"}">${a.a >= 0 ? "+" : ""}${money(a.a)}</b></div>`).join("") || `<div class="empty">${t("empty")}</div>`}</div>`);
  }
  function statsPage(u) {
    return shell(u, "menu", `<div class="section-title" style="padding-top:16px"><h3>মেম্বার স্ট্যাটস</h3></div>
      <div class="quick">
        <div class="q"><b>${money(u.earned)}</b><span>${t("earnings")}</span></div>
        <div class="q"><b>${(u.tasksDone || []).length}</b><span>কাজ</span></div>
        <div class="q"><b>${u.activated ? "ON" : "OFF"}</b><span>অ্যাক্টিভ</span></div>
      </div>
      <div class="quick">
        <div class="q"><b>${(u.microDone || []).length}</b><span>মাইক্রো</span></div>
        <div class="q"><b>${u.refs || 0}</b><span>রেফার</span></div>
        <div class="q"><b>${(u.withdraws || []).length}</b><span>উইথড্র</span></div>
      </div>`);
  }
  function profilePage(u) {
    return shell(u, "menu", `<div class="profile-card"><div class="avatar">${initials(u.name)}</div>
      <h3>${u.name}</h3><p style="color:var(--muted)">${u.dial} ${u.phone}</p>
      <p style="margin-top:8px">${u.totp ? "🔐 2FA চালু" : "2FA বন্ধ"}</p>
      <button class="btn sm" style="margin-top:10px" data-act="totp">${u.totp ? "2FA বন্ধ" : "2FA চালু"}</button>
    </div>
    <div class="act"><button class="btn block ghost" data-act="logout">${t("logout")}</button></div>`);
  }
  function withdrawPage(u) {
    const methods = state.catalog.methods || [{ name: "bKash" }, { name: "Nagad" }, { name: "Rocket" }, { name: "Binance" }];
    const color = { bKash: "var(--bkash)", Nagad: "var(--nagad)", Rocket: "var(--rocket)", Binance: "var(--binance)" };
    return shell(u, "withdraw", `
      <div class="bal-hero"><div class="lbl">${t("balance")}</div><div class="amt">${money(u.balance)}</div>
        <div class="lbl">${t("minWd")} · ${u.activated ? "অ্যাক্টিভ" : "অ্যাক্টিভেশন লাগবে"}</div></div>
      <div class="pay-pick">${methods.map(m => `<button class="${state.wdMethod === m.name ? "on" : ""}" data-act="wd-method" data-m="${m.name}" style="background:${color[m.name] || "#333"};color:#fff">${m.name}</button>`).join("")}</div>
      <form class="act" data-act="withdraw">
        <div class="field"><label>${t("amount")}</label><input id="wdAmount" inputmode="numeric" value="${state.wdAmount}"></div>
        <div class="field"><label>${t("wallet")}</label><input id="wdWallet" value="${state.wdWallet}"></div>
        <button class="btn block lg gold" type="submit">${t("sendWd")}</button>
      </form>
      <div class="section-title"><h3>${t("history")}</h3></div>
      <div class="hist">${(u.withdraws || []).map(w => `<div class="row"><div><b>${w.method}</b><div style="color:var(--muted);font-size:12px">${w.wallet}</div></div>
        <div style="text-align:right"><b>${money(w.amount)}</b><div><span class="pill ${w.status === "paid" ? "ok" : w.status === "rejected" ? "no" : "wait"}">${w.status}</span></div></div></div>`).join("") || `<div class="empty">${t("empty")}</div>`}</div>`);
  }

  /* ---------- ADMIN ---------- */
  const ADMIN_LINKS = [
    ["/admin", "ড্যাশবোর্ড"],
    ["/admin/users", "ইউজার"],
    ["/admin/withdrawals", "উইথড্র"],
    ["/admin/methods", "উইথড্র মেথড"],
    ["/admin/activations", "অ্যাক্টিভেশন"],
    ["/admin/tasks", "টাস্ক সেটিংস"],
    ["/admin/micro", "মাইক্রো জব"],
    ["/admin/typing", "টাইপিং জব"],
    ["/admin/jobs", "জব পোস্ট"],
    ["/admin/salary", "মাসিক সেলারি"],
    ["/admin/targets", "টার্গেট বোনাস"],
    ["/admin/gifts", "গিফট / শিট"],
    ["/admin/tickets", "সাপোর্ট"],
    ["/admin/popup", "পপআপ"],
    ["/admin/settings", "সেটিংস"],
    ["/admin/account", "এডমিন অ্যাকাউন্ট"]
  ];

  function adminLayout(title, body) {
    const { path } = route();
    return `<div class="admin-shell">
      <aside class="admin-side">
        <a class="brand" href="#/admin" style="margin-bottom:14px"><img src="assets/img/logo.png" alt="" style="width:34px;height:34px;border-radius:10px"><div>Admin<small>EasySell BD</small></div></a>
        ${ADMIN_LINKS.map(([href, lab]) => `<a class="${path === href ? "on" : ""}" href="#${href}">${lab}</a>`).join("")}
        <a href="#/" style="margin-top:18px">সাইটে যান</a>
        <button class="link" data-act="admin-logout">লগআউট</button>
      </aside>
      <div class="admin-main">
        <div class="admin-nav-mobile">${ADMIN_LINKS.map(([href, lab]) => `<a class="${path === href ? "on" : ""}" href="#${href}">${lab}</a>`).join("")}</div>
        <div class="admin-top"><h2 style="font-family:var(--display)">${title}</h2><button class="lang-btn" data-act="lang">${t("lang")}</button></div>
        ${body}
      </div>
    </div>`;
  }

  function tbl(headers, rows) {
    return `<div class="table-wrap"><table class="tbl"><thead><tr>${headers.map(h => `<th>${h}</th>`).join("")}</tr></thead><tbody>${rows || `<tr><td colspan="${headers.length}">${t("empty")}</td></tr>`}</tbody></table></div>`;
  }

  function adminDash() {
    const o = state.extra.overview || { stats: {}, pendingWithdraws: 0, pendingActivations: 0, tickets: 0, users: 0 };
    return adminLayout("এডমিন ড্যাশবোর্ড", `<div class="kpi">
      <div class="q"><b>${o.users || 0}</b><span>ইউজার</span></div>
      <div class="q"><b>${o.pendingWithdraws || 0}</b><span>পেন্ডিং উইথড্র</span></div>
      <div class="q"><b>${o.pendingActivations || 0}</b><span>অ্যাক্টিভেশন</span></div>
      <div class="q"><b>${o.tickets || 0}</b><span>টিকেট</span></div>
    </div>
    <a class="btn sm" href="/api/admin/export.csv" data-act="export">ইউজার CSV (sheets.php)</a>`);
  }
  function adminUsers() {
    const users = (state.extra.overview && state.extra.overview.usersAll) || [];
    return adminLayout("ইউজার", tbl(["নাম", "ফোন", "ব্যালেন্স", "অ্যাক্টিভ", ""], users.map(u => `<tr>
      <td>${u.name}</td><td>${u.dial}${u.phone}</td><td>${money(u.balance)}</td>
      <td>${u.activated ? "yes" : "no"} ${u.banned ? "BAN" : ""}</td>
      <td><button class="btn sm" data-act="adm-user" data-id="${u.id}" data-k="add">+৳50</button>
          <button class="btn sm ghost" data-act="adm-user" data-id="${u.id}" data-k="activated">${u.activated ? "ডিঅ্যাক্টিভ" : "অ্যাক্টিভ"}</button>
          <button class="btn sm ghost" data-act="adm-user" data-id="${u.id}" data-k="ban">${u.banned ? "আনব্যান" : "ব্যান"}</button></td>
    </tr>`).join("")));
  }
  function adminWithdrawals() {
    const users = (state.extra.overview && state.extra.overview.usersAll) || [];
    const rows = users.flatMap(u => (u.withdraws || []).map(w => ({ ...w, uname: u.name })));
    return adminLayout("উইথড্র", tbl(["ইউজার", "মেথড", "পরিমাণ", "ওয়ালেট", "স্ট্যাটাস", ""], rows.map(w => `<tr>
      <td>${w.uname}</td><td>${w.method}</td><td>${money(w.amount)}</td><td>${w.wallet}</td>
      <td><span class="pill ${w.status === "paid" ? "ok" : w.status === "rejected" ? "no" : "wait"}">${w.status}</span></td>
      <td>${w.status === "pending" ? `<button class="btn sm" data-act="adm-wd" data-id="${w.id}" data-s="paid">পেইড</button>
        <button class="btn sm ghost" data-act="adm-wd" data-id="${w.id}" data-s="rejected">রিজেক্ট</button>` : ""}</td>
    </tr>`).join("")));
  }
  function adminActivations() {
    const list = (state.extra.overview && state.extra.overview.activations) || [];
    return adminLayout("অ্যাক্টিভেশন", tbl(["নাম", "মেথড", "Trx", "স্ট্যাটাস", ""], list.map(a => `<tr>
      <td>${a.name}</td><td>${a.method}</td><td>${a.trx}</td><td>${a.status}</td>
      <td>${a.status === "pending" ? `<button class="btn sm" data-act="adm-act" data-id="${a.id}" data-s="approved">এপ্রুভ</button>
        <button class="btn sm ghost" data-act="adm-act" data-id="${a.id}" data-s="rejected">রিজেক্ট</button>` : ""}</td>
    </tr>`).join("")));
  }
  function jsonEditor(col, items, title) {
    return adminLayout(title, `<p class="hint" style="margin-bottom:10px">JSON সেভ করুন — ${col}</p>
      <form data-act="save-col" data-col="${col}">
        <div class="field"><textarea id="jsonCol" style="min-height:280px">${JSON.stringify(items || [], null, 2)}</textarea></div>
        <button class="btn">সেভ</button>
      </form>`);
  }
  function adminTickets() {
    const list = (state.extra.overview && state.extra.overview.ticketsAll) || [];
    return adminLayout("সাপোর্ট টিকেট", list.map(tk => `<div class="card" style="margin-bottom:10px">
      <h3>${tk.subject} · ${tk.name}</h3>
      ${(tk.msgs || []).map(m => `<p style="color:var(--muted)"><b>${m.from}:</b> ${m.text}</p>`).join("")}
      <div class="field"><input data-reply="${tk.id}" placeholder="রিপ্লাই"></div>
      <button class="btn sm" data-act="adm-reply" data-id="${tk.id}">পাঠান</button>
    </div>`).join("") || `<div class="empty">${t("empty")}</div>`);
  }
  function adminSettings() {
    const s = (state.extra.overview && state.extra.overview.settings) || {};
    return adminLayout("সেটিংস", `<form data-act="adm-settings">
      <div class="field"><label>সাইট নাম</label><input name="siteName" value="${s.siteName || ""}"></div>
      <div class="field"><label>জয়েনিং বোনাস</label><input name="joiningBonus" value="${s.joiningBonus || 0}"></div>
      <div class="field"><label>রেফার বোনাস</label><input name="refBonus" value="${s.refBonus || 0}"></div>
      <div class="field"><label>মিন উইথড্র</label><input name="minWithdraw" value="${s.minWithdraw || 0}"></div>
      <div class="field"><label>অ্যাক্টিভেশন ফি</label><input name="activationFee" value="${s.activationFee || 0}"></div>
      <button class="btn">সেভ</button>
    </form>`);
  }
  function adminPopup() {
    const p = ((state.extra.overview && state.extra.overview.settings) || {}).popup || {};
    return adminLayout("পপআপ সেটিংস", `<form data-act="adm-popup">
      <div class="field"><label>চালু (true/false)</label><input name="on" value="${p.on ? "true" : "false"}"></div>
      <div class="field"><label>টাইটেল</label><input name="title" value="${p.title || ""}"></div>
      <div class="field"><label>বডি</label><textarea name="body">${p.body || ""}</textarea></div>
      <button class="btn">সেভ</button>
    </form>`);
  }
  function adminAccount() {
    const user = (state.extra.overview && state.extra.overview.adminUser) || "admin";
    return adminLayout("এডমিন অ্যাকাউন্ট", `<form data-act="adm-account">
      <div class="field"><label>ইউজার</label><input name="user" value="${user}"></div>
      <div class="field"><label>নতুন পাসওয়ার্ড</label><input name="pass" type="password"></div>
      <button class="btn">সেভ</button>
    </form>`);
  }

  function bindInputs() {
    ["name", "phone", "pass", "cpass", "adminUser", "adminPass", "gift", "trx", "typeText", "subj", "body", "report", "wdAmount", "wdWallet", "cq"].forEach(id => {
      const el = document.getElementById(id);
      if (!el) return;
      el.addEventListener("input", e => {
        if (id === "phone") {
          state.form.phone = e.target.value.replace(/\D/g, "").slice(0, state.country.len + 1);
          e.target.value = state.form.phone;
          const p = $(".preview"); if (p) p.textContent = `${state.country.dial} ${state.form.phone}`;
        } else if (id === "cq") {
          state.countryQ = e.target.value; render(); const n = $("#cq"); if (n) { n.focus(); n.selectionStart = n.selectionEnd = n.value.length; }
        } else if (id === "wdAmount") state.wdAmount = e.target.value.replace(/\D/g, "");
        else if (id === "wdWallet") state.wdWallet = e.target.value;
        else state.form[id] = e.target.value;
      });
    });
  }

  async function register() {
    const { name, phone, pass, cpass } = state.form;
    if (!name.trim()) return toast(t("errName"), true);
    if (phone.length < 7) return toast(t("errPhone"), true);
    if (pass.length < 6) return toast(t("errPass"), true);
    if (pass !== cpass) return toast(t("errMatch"), true);
    try {
      const data = await api("/api/register", { method: "POST", body: JSON.stringify({ name: name.trim(), phone, dial: state.country.dial, country: state.country.code, pass, ref: refCode() }) });
      state.token = data.token; state.user = data.user; store.set("es_token", data.token);
      if (window.socket) window.socket.emit("auth", data.token);
      toast(t("bonus")); go("/app");
    } catch (e) { toast(e.message, true); }
  }
  async function login() {
    try {
      const data = await api("/api/login", { method: "POST", body: JSON.stringify({ phone: state.form.phone, pass: state.form.pass }) });
      state.token = data.token; state.user = data.user; store.set("es_token", data.token);
      if (window.socket) window.socket.emit("auth", data.token);
      go("/app");
    } catch (e) { toast(e.message, true); }
  }
  async function adminLogin() {
    try {
      const data = await api("/api/admin/login", { method: "POST", body: JSON.stringify({ user: state.form.adminUser, pass: state.form.adminPass }) }, null);
      state.adminToken = data.token; store.set("es_admin", data.token);
      go("/admin");
    } catch (e) { toast(e.message, true); }
  }

  function startTask(id, kind) {
    state.doing = id; state.doingKind = kind; state.progress = 0; render();
    const timer = setInterval(() => {
      if (state.doing !== id) { clearInterval(timer); return; }
      state.progress = Math.min(100, state.progress + 8);
      const bar = $(".bar i"); if (bar) bar.style.width = state.progress + "%";
      if (state.progress >= 100) {
        clearInterval(timer);
        const btn = $("[data-act=finish-task]"); if (btn) { btn.disabled = false; btn.textContent = t("submit"); }
      }
    }, 180);
  }
  async function finishTask() {
    if (!state.doing || state.progress < 100) return;
    const id = state.doing;
    const kind = state.doingKind;
    const path = kind === "microDone" ? "/api/micro/" + id + "/do" : kind === "jobsDone" ? "/api/jobs/" + id + "/do" : "/api/tasks/" + id + "/complete";
    try {
      const data = await api(path, { method: "POST", body: "{}" });
      state.user = data.user; state.doing = null; toast(t("taskOk") + " · " + money(data.reward)); render();
    } catch (e) { toast(e.message, true); }
  }

  async function loadAdmin() {
    try { state.extra.overview = await api("/api/admin/overview", {}, state.adminToken); }
    catch { state.adminToken = null; store.set("es_admin", null); go("/admin/login"); }
  }
  async function loadExtras(path) {
    try {
      if (path === "/app/team") { const d = await api("/api/team"); state.extra.team = d.members || []; }
      if (path === "/app/board") { const d = await api("/api/leaderboard"); state.extra.board = d.list || []; }
      if (path === "/app/support") { const d = await api("/api/support"); state.extra.tickets = d.tickets || []; }
      const me = await api("/api/me"); state.user = me.user; if (me.catalog) state.catalog = me.catalog;
    } catch {}
  }

  async function onClick(e) {
    const btn = e.target.closest("[data-act]");
    if (!btn) return;
    const act = btn.dataset.act;
    if (act === "lang") { state.lang = state.lang === "bn" ? "en" : "bn"; store.set("es_lang", state.lang); render(); }
    if (act === "open-cc") { state.countryOpen = true; render(); }
    if (act === "close-sheet") { state.countryOpen = false; render(); }
    if (act === "pick-cc") { state.country = ES.COUNTRIES.find(c => c.code === btn.dataset.code) || state.country; state.countryOpen = false; render(); }
    if (act === "start-task") startTask(btn.dataset.id, btn.dataset.kind);
    if (act === "close-task") { state.doing = null; render(); }
    if (act === "finish-task") finishTask();
    if (act === "wd-method") { state.wdMethod = btn.dataset.m; render(); }
    if (act === "copy") { navigator.clipboard?.writeText(btn.dataset.text); toast(t("copied")); }
    if (act === "logout") { state.token = null; state.user = null; store.set("es_token", null); go("/"); }
    if (act === "admin-logout") { state.adminToken = null; store.set("es_admin", null); go("/admin/login"); }
    if (act === "seen-popup") {
      try { const d = await api("/api/popup/seen", { method: "POST", body: "{}" }); state.user = d.user; state.popup = false; render(); } catch {}
    }
    if (act === "buy-salary") {
      try { const d = await api("/api/salary/" + btn.dataset.id + "/buy", { method: "POST", body: "{}" }); state.user = d.user; toast(t("saved")); render(); } catch (e) { toast(e.message, true); }
    }
    if (act === "claim-target") {
      try { const d = await api("/api/target/" + btn.dataset.id + "/claim", { method: "POST", body: "{}" }); state.user = d.user; toast(t("taskOk") + " · " + money(d.reward)); render(); } catch (e) { toast(e.message, true); }
    }
    if (act === "totp") {
      try { const d = await api("/api/totp/toggle", { method: "POST", body: "{}" }); state.user = d.user; render(); } catch (e) { toast(e.message, true); }
    }
    if (act === "adm-user") {
      const body = {};
      if (btn.dataset.k === "add") body.add = 50;
      if (btn.dataset.k === "ban") body.ban = !((state.extra.overview.usersAll.find(u => u.id === btn.dataset.id) || {}).banned);
      if (btn.dataset.k === "activated") body.activated = !((state.extra.overview.usersAll.find(u => u.id === btn.dataset.id) || {}).activated);
      try { await api("/api/admin/users/" + btn.dataset.id, { method: "POST", body: JSON.stringify(body) }, state.adminToken); await loadAdmin(); render(); } catch (e) { toast(e.message, true); }
    }
    if (act === "adm-wd") {
      try { await api("/api/admin/withdrawals/" + btn.dataset.id, { method: "POST", body: JSON.stringify({ status: btn.dataset.s }) }, state.adminToken); await loadAdmin(); render(); } catch (e) { toast(e.message, true); }
    }
    if (act === "adm-act") {
      try { await api("/api/admin/activations/" + btn.dataset.id, { method: "POST", body: JSON.stringify({ status: btn.dataset.s }) }, state.adminToken); await loadAdmin(); render(); } catch (e) { toast(e.message, true); }
    }
    if (act === "adm-reply") {
      const inp = document.querySelector(`[data-reply="${btn.dataset.id}"]`);
      try { await api("/api/admin/tickets/" + btn.dataset.id + "/reply", { method: "POST", body: JSON.stringify({ text: inp && inp.value }) }, state.adminToken); await loadAdmin(); render(); toast(t("saved")); } catch (e) { toast(e.message, true); }
    }
    if (act === "export") {
      e.preventDefault();
      try {
        const res = await fetch("/api/admin/export.csv", { headers: { Authorization: "Bearer " + state.adminToken } });
        const blob = await res.blob(); const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "users.csv"; a.click();
      } catch (err) { toast(err.message, true); }
    }
  }

  async function onSubmit(e) {
    const form = e.target.closest("form[data-act]");
    if (!form) return;
    e.preventDefault();
    const act = form.dataset.act;
    try {
      if (act === "register") return register();
      if (act === "login") return login();
      if (act === "admin-login") return adminLogin();
      if (act === "withdraw") {
        const data = await api("/api/withdraw", { method: "POST", body: JSON.stringify({ amount: Number(state.wdAmount), method: state.wdMethod, wallet: state.wdWallet }) });
        state.user = data.user; state.wdAmount = ""; toast(t("wdOk")); render();
      }
      if (act === "typing") {
        const data = await api("/api/typing/complete", { method: "POST", body: JSON.stringify({ text: state.form.typeText }) });
        state.user = data.user; toast(t("taskOk") + " · " + money(data.reward)); render();
      }
      if (act === "gift") {
        const data = await api("/api/gift", { method: "POST", body: JSON.stringify({ code: state.form.gift }) });
        state.user = data.user; toast(t("taskOk") + " · " + money(data.reward)); render();
      }
      if (act === "activate") {
        const method = ($("#actMethod") || {}).value;
        await api("/api/activate", { method: "POST", body: JSON.stringify({ method, trx: state.form.trx }) });
        toast(t("wdOk")); render();
      }
      if (act === "support") {
        const d = await api("/api/support", { method: "POST", body: JSON.stringify({ subject: state.form.subj, body: state.form.body }) });
        state.extra.tickets = d.tickets; toast(t("saved")); render();
      }
      if (act === "report") { await api("/api/report", { method: "POST", body: JSON.stringify({ text: state.form.report }) }); toast(t("saved")); }
      if (act === "save-col") {
        const items = JSON.parse($("#jsonCol").value);
        await api("/api/admin/save-col", { method: "POST", body: JSON.stringify({ col: form.dataset.col, items }) }, state.adminToken);
        await loadAdmin(); toast(t("saved"));
      }
      if (act === "adm-settings") {
        const fd = new FormData(form);
        await api("/api/admin/settings", { method: "POST", body: JSON.stringify(Object.fromEntries(fd.entries())) }, state.adminToken);
        await loadAdmin(); toast(t("saved"));
      }
      if (act === "adm-popup") {
        const fd = new FormData(form);
        await api("/api/admin/settings", { method: "POST", body: JSON.stringify({ popup: { on: fd.get("on") === "true", title: fd.get("title"), body: fd.get("body") } }) }, state.adminToken);
        await loadAdmin(); toast(t("saved"));
      }
      if (act === "adm-account") {
        const fd = new FormData(form);
        await api("/api/admin/account", { method: "POST", body: JSON.stringify({ user: fd.get("user"), pass: fd.get("pass") }) }, state.adminToken);
        toast(t("saved"));
      }
    } catch (err) { toast(err.message, true); }
  }

  async function render() {
    const { path, scroll } = route();
    if (path.startsWith("/app") && !current()) { go("/login"); return; }
    if (path.startsWith("/admin") && path !== "/admin/login" && !state.adminToken) { go("/admin/login"); return; }

    const u = current();
    const o = state.extra.overview || {};
    const cat = (o.catalog) || {};

    if (path === "/" || path === "") app.innerHTML = landing();
    else if (path === "/login") app.innerHTML = authLayout("login");
    else if (path === "/register") app.innerHTML = authLayout("register");
    else if (path === "/admin/login") app.innerHTML = authLayout("admin");
    else if (path === "/app") { state.popup = true; app.innerHTML = dashHome(u); }
    else if (path === "/app/menu") app.innerHTML = menuPage(u);
    else if (path === "/app/work") app.innerHTML = workPage(u);
    else if (path === "/app/micro") app.innerHTML = microPage(u);
    else if (path === "/app/typing") app.innerHTML = typingPage(u);
    else if (path === "/app/jobs") app.innerHTML = jobsPage(u);
    else if (path === "/app/salary") app.innerHTML = salaryPage(u);
    else if (path === "/app/target") app.innerHTML = targetPage(u);
    else if (path === "/app/gift") app.innerHTML = giftPage(u);
    else if (path === "/app/team") app.innerHTML = teamPage(u);
    else if (path === "/app/board") app.innerHTML = boardPage(u);
    else if (path === "/app/support") app.innerHTML = supportPage(u);
    else if (path === "/app/report") app.innerHTML = reportPage(u);
    else if (path === "/app/activate") app.innerHTML = activatePage(u);
    else if (path === "/app/history") app.innerHTML = historyPage(u);
    else if (path === "/app/stats") app.innerHTML = statsPage(u);
    else if (path === "/app/profile") app.innerHTML = profilePage(u);
    else if (path === "/app/withdraw") app.innerHTML = withdrawPage(u);
    else if (path === "/admin") app.innerHTML = adminDash();
    else if (path === "/admin/users") app.innerHTML = adminUsers();
    else if (path === "/admin/withdrawals") app.innerHTML = adminWithdrawals();
    else if (path === "/admin/methods") app.innerHTML = jsonEditor("methods", cat.methods, "উইথড্র মেথড");
    else if (path === "/admin/activations") app.innerHTML = adminActivations();
    else if (path === "/admin/tasks") app.innerHTML = jsonEditor("tasks", cat.tasks, "টাস্ক সেটিংস");
    else if (path === "/admin/micro") app.innerHTML = jsonEditor("microJobs", cat.microJobs, "মাইক্রো জব");
    else if (path === "/admin/typing") app.innerHTML = jsonEditor("typingJobs", cat.typingJobs, "টাইপিং জব");
    else if (path === "/admin/jobs") app.innerHTML = jsonEditor("jobPosts", cat.jobPosts, "জব পোস্ট");
    else if (path === "/admin/salary") app.innerHTML = jsonEditor("salaryPlans", cat.salaryPlans, "মাসিক সেলারি");
    else if (path === "/admin/targets") app.innerHTML = jsonEditor("targets", cat.targets, "টার্গেট বোনাস");
    else if (path === "/admin/gifts") app.innerHTML = jsonEditor("gifts", cat.gifts, "গিফট / শিট");
    else if (path === "/admin/tickets") app.innerHTML = adminTickets();
    else if (path === "/admin/popup") app.innerHTML = adminPopup();
    else if (path === "/admin/settings") app.innerHTML = adminSettings();
    else if (path === "/admin/account") app.innerHTML = adminAccount();
    else app.innerHTML = landing();

    bindInputs();
    document.documentElement.lang = state.lang === "bn" ? "bn" : "en";
    if (scroll) requestAnimationFrame(() => document.getElementById(scroll)?.scrollIntoView({ behavior: "smooth" }));
  }

  function patchLive() {
    const users = $("#st-users"); const paid = $("#st-paid"); const ticker = $("#live-ticker");
    if (users) users.textContent = state.live.users || 0;
    if (paid) paid.textContent = money(state.live.paid || 0);
    if (ticker) ticker.innerHTML = tickerHtml();
  }

  function connectSocket() {
    if (!window.io) return;
    const socket = window.io({ transports: ["polling", "websocket"] });
    window.socket = socket;
    if (state.token) socket.emit("auth", state.token);
    socket.on("stats", s => { state.live = { ...state.live, ...s }; patchLive(); });
    socket.on("ticker", item => { state.live.ticker = [item, ...(state.live.ticker || [])].slice(0, 20); patchLive(); });
    socket.on("me", user => { state.user = user; const { path } = route(); if (path.startsWith("/app")) render(); });
    socket.on("paid", info => toast(t("paid") + " · " + money(info.amount) + " " + info.method));
  }

  let lastPath = "";
  async function routeLoad() {
    const { path } = route();
    if (path === lastPath && path.startsWith("/app") === false) { render(); return; }
    lastPath = path;
    if (path.startsWith("/app") && state.token) await loadExtras(path);
    if (path.startsWith("/admin") && path !== "/admin/login" && state.adminToken) await loadAdmin();
    render();
  }

  async function boot() {
    try { const pub = await api("/api/public"); state.live = { ...state.live, ...pub }; } catch {}
    try { const cat = await api("/api/catalog"); state.catalog = { ...state.catalog, ...cat }; } catch {}
    if (state.token) {
      try { const me = await api("/api/me"); state.user = me.user; if (me.catalog) state.catalog = me.catalog; }
      catch { state.token = null; state.user = null; store.set("es_token", null); }
    }
    await routeLoad();
    connectSocket();
  }

  document.addEventListener("click", onClick);
  document.addEventListener("submit", onSubmit);
  window.addEventListener("hashchange", routeLoad);
  boot();
})();
