(() => {
  const $ = (sel, el = document) => el.querySelector(sel);
  const app = $("#app");
  const toastBox = $("#toast");

  const store = {
    get(k, d) {
      try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; }
    },
    set(k, v) { localStorage.setItem(k, JSON.stringify(v)); }
  };

  const state = {
    lang: store.get("es_lang", "bn"),
    token: store.get("es_token", null),
    user: null,
    country: ES.COUNTRIES[0],
    countryOpen: false,
    countryQ: "",
    form: { name: "", phone: "", pass: "", cpass: "" },
    doing: null,
    progress: 0,
    wdMethod: "bKash",
    wdAmount: "",
    wdWallet: "",
    live: { users: 0, paid: 0, online: 0, ticker: ES.TICKER.map(x => ({ ...x, img: "/" + x.img.replace(/^\//, "") })) },
    busy: false
  };

  function t(k) {
    return (ES.I18N[state.lang] && ES.I18N[state.lang][k]) || k;
  }
  function money(n) {
    return "৳" + Number(n || 0).toLocaleString("en-BD");
  }
  function flag(code) {
    return `https://flagcdn.com/w40/${code}.png`;
  }
  function initials(name) {
    return (name || "U").trim().split(/\s+/).slice(0, 2).map(s => s[0]).join("").toUpperCase();
  }
  function current() { return state.user; }
  function route() {
    let h = location.hash.replace(/^#/, "") || "/";
    let scroll = null;
    if (!h.startsWith("/")) {
      scroll = h;
      h = "/";
    } else if (h.includes("#")) {
      const parts = h.split("#");
      h = parts[0] || "/";
      scroll = parts[1];
    }
    return { path: (h.split("?")[0] || "/"), scroll };
  }
  function go(path) { location.hash = path; }
  function refCode() {
    const q = location.hash.split("?")[1] || "";
    return new URLSearchParams(q).get("ref") || "";
  }

  async function api(path, opts = {}) {
    const headers = { "Content-Type": "application/json", ...(opts.headers || {}) };
    if (state.token) headers.Authorization = "Bearer " + state.token;
    const res = await fetch(path, { ...opts, headers });
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
    tasks: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="4" width="16" height="16" rx="3"/><path d="M8 12l2.5 2.5L16 9"/></svg>`,
    wd: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 4v12M7 11l5 5 5-5"/><path d="M5 20h14"/></svg>`,
    refer: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="8" r="3"/><path d="M4 19a5 5 0 0 1 10 0"/><path d="M16 11h5M18.5 8.5v5"/></svg>`,
    user: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="3.5"/><path d="M5 19a7 7 0 0 1 14 0"/></svg>`
  };

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
        </div>
        <div class="nav-right">
          <span class="live-pill"><i></i> ${state.live.online || 0} ${t("liveNow")}</span>
          <button class="lang-btn" data-act="lang">${t("lang")}</button>
          ${u
            ? `<a class="btn sm" href="#/app">${t("dash")}</a>`
            : `<a class="ghost-btn" href="#/login">${t("login")}</a>
               <a class="btn sm" href="#/register">${t("register")}</a>`}
        </div>
      </nav>`;
  }

  function landing() {
    const features = [
      ["⚡", "f1t", "f1d", "Simple Tasks"],
      ["💎", "f2t", "f2d", "Instant Rewards"],
      ["🎯", "f3t", "f3d", "Referral Bonus"],
      ["💵", "f4t", "f4d", "Fast Withdrawal"],
      ["📱", "f5t", "f5d", "24/7 Support"],
      ["🏆", "f6t", "f6d", "100% Secure"]
    ].map(([ico, tk, dk, en]) => `
      <article class="card">
        <div class="ico">${ico}</div>
        <h3>${t(tk)}<span class="en-sub">${en}</span></h3>
        <p>${t(dk)}</p>
      </article>`).join("");

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
            <img class="phone" src="assets/img/hero-phone.jpg" alt="EasySell app">
            <div class="float-chip chip-a">
              <img src="assets/img/avatar-2.jpg" alt="">
              <div>সুমাইয়া · চট্টগ্রাম<br><b>+ ${money(180)} Nagad</b></div>
            </div>
            <div class="float-chip chip-b">
              <img src="assets/img/avatar-1.jpg" alt="">
              <div>রাকিব · ঢাকা<br><b>+ ${money(350)} bKash</b></div>
            </div>
          </div>
        </section>
      </div>
      <div class="ticker-wrap" aria-label="${t("liveNow")}">
        <div class="ticker" id="live-ticker">${tickerHtml()}</div>
      </div>
      <div class="wrap">
        <section id="why">
          <div class="sec-head">
            <h2>${t("whyTitle")}</h2>
            <p>${t("whySub")}</p>
          </div>
          <div class="grid-3">${features}</div>
        </section>
        <section id="how">
          <div class="sec-head">
            <h2>${t("howTitle")}</h2>
            <p>${t("howSub")}</p>
          </div>
          <div class="steps">
            <div class="step"><div class="num">১</div><div><h3>${t("s1t")}</h3><p>${t("s1d")}</p></div></div>
            <div class="step"><div class="num">২</div><div><h3>${t("s2t")}</h3><p>${t("s2d")}</p></div></div>
            <div class="step"><div class="num">৩</div><div><h3>${t("s3t")}</h3><p>${t("s3d")}</p></div></div>
          </div>
        </section>
        <section id="pay">
          <div class="sec-head">
            <h2>${t("payTitle")}</h2>
            <p>${t("paySub")}</p>
          </div>
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
            <h2>${t("ctaTitle")}</h2>
            <p>${t("ctaSub")}</p>
            <a class="btn lg gold" href="#/register">${t("ctaBtn")}</a>
          </div>
        </section>
      </div>
      <footer class="site">${t("foot")}</footer>`;
  }

  function countrySheet() {
    const q = state.countryQ.toLowerCase();
    const list = ES.COUNTRIES.filter(c =>
      !q || c.name.toLowerCase().includes(q) || c.nameBn.includes(q) || c.dial.includes(q) || c.code.includes(q)
    );
    return `
      <div class="overlay" data-act="close-sheet">
        <div class="sheet" onclick="event.stopPropagation()">
          <div style="display:flex;justify-content:space-between;align-items:center">
            <h3>${t("pickCountry")}</h3>
            <button class="ghost-btn" data-act="close-sheet">${t("close")}</button>
          </div>
          <input class="search" id="cq" placeholder="${t("search")}" value="${state.countryQ}">
          <div class="clist">
            ${list.map(c => `
              <button class="crow ${c.code === state.country.code ? "active" : ""}" data-act="pick-cc" data-code="${c.code}">
                <img src="${flag(c.code)}" alt="">
                <div>${state.lang === "bn" ? c.nameBn : c.name}<small style="display:block;color:var(--muted)">${c.name}</small></div>
                <small>${c.dial}</small>
              </button>`).join("")}
          </div>
        </div>
      </div>`;
  }

  function phoneField() {
    const c = state.country;
    const full = state.form.phone ? `${c.dial} ${state.form.phone}` : c.dial;
    return `
      <div class="field">
        <label>${t("mobile")} · ${t("countriesN")}</label>
        <div class="phone-row">
          <button type="button" class="cc-btn" data-act="open-cc">
            <img src="${flag(c.code)}" alt="${c.code}">
            <span>${c.dial}</span>
            ▾
          </button>
          <input id="phone" inputmode="numeric" autocomplete="tel" placeholder="${c.len} digit" value="${state.form.phone}">
        </div>
        <div class="preview">${full}</div>
        <div class="hint">${t("fullNum")}</div>
      </div>`;
  }

  function authLayout(kind) {
    const isReg = kind === "register";
    return `
      <div class="auth-page">
        <aside class="auth-side">
          <a class="brand" href="#/">
            <img src="assets/img/logo.png" alt="">
            <div>EasySell BD<small>${t("tagline")}</small></div>
          </a>
          <div>
            <div class="quote">${t("heroTitle1")}<br>${t("heroTitle2")}<br><em style="color:var(--mint)">${t("heroTitle3")}</em></div>
            <p style="color:var(--muted);margin-top:14px;max-width:360px">${t("heroSub")}</p>
          </div>
          <img src="assets/img/hero-phone.jpg" alt="" style="width:min(360px,100%);opacity:.9">
        </aside>
        <main class="auth-main">
          <div style="display:flex;justify-content:space-between;align-items:center">
            <a class="ghost-btn" href="#/">${t("back")}</a>
            <button class="lang-btn" data-act="lang">${t("lang")}</button>
          </div>
          <div class="auth-card">
            <a class="brand" href="#/" style="margin-bottom:8px">
              <img src="assets/img/logo.png" alt="">
              <div>EasySell BD</div>
            </a>
            <p class="world">${isReg ? t("worldReg") : t("worldLog")}</p>
            <h1>${isReg ? t("doReg") : t("doLog")}</h1>
            <div class="steps-mini">
              <div><b>১.</b> ${t("step1")}</div>
              <div><b>২.</b> ${t("step2")}</div>
              <div><b>৩.</b> ${isReg ? t("step3r") : t("step3l")}</div>
            </div>
            <form data-act="${isReg ? "register" : "login"}">
              ${isReg ? `<div class="field"><label>${t("name")}</label><input id="name" value="${state.form.name}" autocomplete="name"></div>` : ""}
              ${phoneField()}
              <div class="field"><label>${t("pass")}</label><input id="pass" type="password" value="${state.form.pass}" autocomplete="${isReg ? "new-password" : "current-password"}"></div>
              ${isReg ? `<div class="field"><label>${t("cpass")}</label><input id="cpass" type="password" value="${state.form.cpass}" autocomplete="new-password"></div>` : ""}
              <button class="btn block lg" type="submit" ${state.busy ? "disabled" : ""}>${isReg ? t("doReg") : t("doLog")}</button>
            </form>
            <p class="switch">
              ${isReg ? t("haveAcc") + ' <a href="#/login">' + t("goLogin") + "</a>" : t("noAcc") + ' <a href="#/register">' + t("goReg") + "</a>"}
            </p>
            <p class="demo">${t("demoHint")}</p>
          </div>
        </main>
      </div>
      ${state.countryOpen ? countrySheet() : ""}`;
  }

  function bottom(tab) {
    const items = [
      ["home", I.home, t("dash"), "#/app"],
      ["tasks", I.tasks, t("tasks"), "#/app/tasks"],
      ["withdraw", I.wd, t("withdraw"), "#/app/withdraw"],
      ["refer", I.refer, t("refer"), "#/app/refer"],
      ["profile", I.user, t("profile"), "#/app/profile"]
    ];
    return `<nav class="bottom-nav">${items.map(([k, ico, lab, href]) =>
      `<a class="${tab === k ? "on" : ""}" href="${href}">${ico}<span>${lab}</span></a>`).join("")}</nav>`;
  }

  function appTop(u) {
    return `
      <div class="app-top">
        <div class="who">
          <div class="avatar">${initials(u.name)}</div>
          <div><small>${t("hi")}</small><b>${u.name}</b></div>
        </div>
        <div style="display:flex;gap:8px;align-items:center">
          <span class="live-pill"><i></i> live</span>
          <button class="lang-btn" data-act="lang">${t("lang")}</button>
        </div>
      </div>`;
  }

  function dashHome(u) {
    const recent = (u.activity || []).slice(0, 5);
    const openTasks = ES.TASKS.filter(x => !(u.tasksDone || []).includes(x.id)).slice(0, 4);
    return `
      <div class="app-shell">
        ${appTop(u)}
        <div class="bal-hero">
          <div class="lbl">${t("balance")}</div>
          <div class="amt">${money(u.balance)}</div>
          <a class="btn gold" href="#/app/withdraw">${t("withdraw")}</a>
        </div>
        <div class="quick">
          <div class="q"><b>${money(u.today || 0)}</b><span>${t("today")}</span></div>
          <div class="q"><b>${(u.tasksDone || []).length}</b><span>${t("done")}</span></div>
          <div class="q"><b>${u.refs || 0}</b><span>${t("refs")}</span></div>
        </div>
        <div class="section-title"><h3>${t("available")}</h3><a href="#/app/tasks" style="color:var(--mint);font-size:13px;font-weight:700">${t("allTasks")}</a></div>
        <div class="list">
          ${openTasks.map(taskRow).join("") || `<div class="empty">${t("empty")}</div>`}
        </div>
        <div class="section-title"><h3>${t("activity")}</h3></div>
        <div class="hist">
          ${recent.length ? recent.map(a => `
            <div class="row"><span>${a.t}</span><b style="color:${a.a >= 0 ? "var(--mint)" : "var(--gold)"}">${a.a >= 0 ? "+" : ""}${money(a.a)}</b></div>
          `).join("") : `<div class="empty">${t("empty")}</div>`}
        </div>
        ${bottom("home")}
      </div>
      ${taskModal()}`;
  }

  function taskRow(task) {
    const title = state.lang === "bn" ? task.titleBn : task.titleEn;
    const desc = state.lang === "bn" ? task.descBn : task.descEn;
    const u = current();
    const done = (u.tasksDone || []).includes(task.id);
    return `
      <div class="task ${done ? "done" : ""}">
        <div class="ico">${task.icon}</div>
        <div>
          <h4>${title}</h4>
          <p>${desc}</p>
        </div>
        <div>
          <div class="pay-tag">${money(task.reward)}</div>
          ${done
            ? `<span class="pill ok">${t("approved")}</span>`
            : `<button class="btn sm" style="margin-top:6px" data-act="start-task" data-id="${task.id}">${t("startTask")}</button>`}
        </div>
      </div>`;
  }

  function taskModal() {
    if (!state.doing) return "";
    const task = ES.TASKS.find(x => x.id === state.doing);
    if (!task) return "";
    const title = state.lang === "bn" ? task.titleBn : task.titleEn;
    const ready = state.progress >= 100;
    return `
      <div class="overlay" data-act="close-task">
        <div class="sheet" onclick="event.stopPropagation()">
          <div class="task-modal">
            <div class="big">${task.icon}</div>
            <h3>${title}</h3>
            <p style="color:var(--muted);margin-top:6px">${t("doing")}</p>
            <div class="bar"><i style="width:${state.progress}%"></i></div>
            <p style="color:var(--gold);font-weight:800;margin-bottom:14px">${t("reward")} ${money(task.reward)}</p>
            <button class="btn block" data-act="finish-task" ${ready ? "" : "disabled"}>${ready ? t("submit") : t("doing")}</button>
          </div>
        </div>
      </div>`;
  }

  function dashTasks(u) {
    return `
      <div class="app-shell">
        ${appTop(u)}
        <div class="section-title" style="padding-top:16px"><h3>${t("allTasks")}</h3><span>${ES.TASKS.length}</span></div>
        <div class="list">${ES.TASKS.map(taskRow).join("")}</div>
        ${bottom("tasks")}
      </div>
      ${taskModal()}`;
  }

  function dashWithdraw(u) {
    const methods = [
      ["bKash", "var(--bkash)"],
      ["Nagad", "var(--nagad)"],
      ["Rocket", "var(--rocket)"],
      ["Binance", "var(--binance)"]
    ];
    return `
      <div class="app-shell">
        ${appTop(u)}
        <div class="bal-hero">
          <div class="lbl">${t("balance")}</div>
          <div class="amt">${money(u.balance)}</div>
          <div class="lbl">${t("minWd")}</div>
        </div>
        <div class="section-title"><h3>${t("method")}</h3></div>
        <div class="pay-pick">
          ${methods.map(([m, c]) => `
            <button class="${state.wdMethod === m ? "on" : ""}" data-act="wd-method" data-m="${m}" style="background:${c};color:#fff">${m}</button>
          `).join("")}
        </div>
        <form class="act" data-act="withdraw">
          <div class="field"><label>${t("amount")}</label><input id="wdAmount" inputmode="numeric" value="${state.wdAmount}"></div>
          <div class="field"><label>${t("wallet")}</label><input id="wdWallet" value="${state.wdWallet}" placeholder="${u.dial}…"></div>
          <button class="btn block lg gold" type="submit">${t("sendWd")}</button>
        </form>
        <div class="section-title"><h3>${t("history")}</h3></div>
        <div class="hist">
          ${(u.withdraws || []).length ? u.withdraws.map(w => `
            <div class="row">
              <div><b>${w.method}</b><div style="color:var(--muted);font-size:12px">${w.wallet}</div></div>
              <div style="text-align:right"><b>${money(w.amount)}</b><div><span class="pill ${w.status === "paid" ? "ok" : "wait"}">${w.status === "paid" ? t("paid") : t("pending")}</span></div></div>
            </div>`).join("") : `<div class="empty">${t("empty")}</div>`}
        </div>
        ${bottom("withdraw")}
      </div>`;
  }

  function dashRefer(u) {
    const link = `${location.origin}${location.pathname}#/register?ref=${u.code}`;
    return `
      <div class="app-shell">
        ${appTop(u)}
        <div class="ref-box">
          <div class="lbl">${t("refTitle")}</div>
          <p style="color:var(--muted);margin-top:6px">${t("refSub")}</p>
          <div class="code">${u.code}</div>
          <div class="row-btns">
            <button class="btn sm" data-act="copy" data-text="${u.code}">${t("copy")}</button>
            <button class="btn sm ghost" data-act="copy" data-text="${link}">${t("share")}</button>
          </div>
        </div>
        <div class="quick">
          <div class="q"><b>${u.refs || 0}</b><span>${t("refs")}</span></div>
          <div class="q"><b>${money((u.refs || 0) * 20)}</b><span>${t("joinBonus")}</span></div>
          <div class="q"><b>5%</b><span>commission</span></div>
        </div>
        ${bottom("refer")}
      </div>`;
  }

  function dashProfile(u) {
    return `
      <div class="app-shell">
        ${appTop(u)}
        <div class="profile-card">
          <div class="avatar">${initials(u.name)}</div>
          <h3>${u.name}</h3>
          <p style="color:var(--muted)">${u.dial} ${u.phone}</p>
        </div>
        <div class="quick">
          <div class="q"><b>${money(u.earned || 0)}</b><span>${t("earnings")}</span></div>
          <div class="q"><b>${(u.tasksDone || []).length}</b><span>${t("done")}</span></div>
          <div class="q"><b>${u.refs || 0}</b><span>${t("refs")}</span></div>
        </div>
        <div class="act">
          <button class="btn block ghost" data-act="logout">${t("logout")}</button>
        </div>
        ${bottom("profile")}
      </div>`;
  }

  function bindAuthInputs() {
    const map = { name: "name", phone: "phone", pass: "pass", cpass: "cpass", wdAmount: "wdAmount", wdWallet: "wdWallet", cq: "countryQ" };
    Object.entries(map).forEach(([id, key]) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.addEventListener("input", e => {
        if (id === "phone") state.form.phone = e.target.value.replace(/\D/g, "").slice(0, state.country.len + 1);
        else if (id === "cq") { state.countryQ = e.target.value; render(); $("#cq")?.focus(); const n = $("#cq"); if (n) n.selectionStart = n.selectionEnd = n.value.length; }
        else if (id === "wdAmount") state.wdAmount = e.target.value.replace(/\D/g, "");
        else if (id === "wdWallet") state.wdWallet = e.target.value;
        else state.form[key] = e.target.value;
        if (id === "phone") {
          const p = $(".preview");
          if (p) p.textContent = `${state.country.dial} ${state.form.phone}`;
          e.target.value = state.form.phone;
        }
      });
    });
  }

  async function register() {
    const { name, phone, pass, cpass } = state.form;
    if (!name.trim()) return toast(t("errName"), true);
    if (phone.length < Math.max(7, state.country.len - 2)) return toast(t("errPhone"), true);
    if (pass.length < 6) return toast(t("errPass"), true);
    if (pass !== cpass) return toast(t("errMatch"), true);
    try {
      state.busy = true;
      const data = await api("/api/register", {
        method: "POST",
        body: JSON.stringify({
          name: name.trim(),
          phone,
          dial: state.country.dial,
          country: state.country.code,
          pass,
          ref: refCode()
        })
      });
      state.token = data.token;
      state.user = data.user;
      store.set("es_token", data.token);
      if (window.socket) window.socket.emit("auth", data.token);
      toast(t("bonus"));
      go("/app");
    } catch (e) {
      toast(e.message, true);
    } finally {
      state.busy = false;
    }
  }

  async function login() {
    const { phone, pass } = state.form;
    try {
      state.busy = true;
      const data = await api("/api/login", {
        method: "POST",
        body: JSON.stringify({ phone, pass })
      });
      state.token = data.token;
      state.user = data.user;
      store.set("es_token", data.token);
      if (window.socket) window.socket.emit("auth", data.token);
      go("/app");
    } catch (e) {
      toast(e.message, true);
    } finally {
      state.busy = false;
    }
  }

  function startTask(id) {
    const u = current();
    if (!u) return;
    if ((u.tasksDone || []).includes(id)) return;
    state.doing = id;
    state.progress = 0;
    render();
    const timer = setInterval(() => {
      if (state.doing !== id) { clearInterval(timer); return; }
      state.progress = Math.min(100, state.progress + 8);
      const bar = $(".bar i");
      if (bar) bar.style.width = state.progress + "%";
      if (state.progress >= 100) {
        clearInterval(timer);
        const btn = $("[data-act=finish-task]");
        if (btn) { btn.disabled = false; btn.textContent = t("submit"); }
      }
    }, 180);
  }

  async function finishTask() {
    if (!state.doing || state.progress < 100) return;
    const id = state.doing;
    try {
      const data = await api("/api/tasks/" + id + "/complete", { method: "POST", body: "{}" });
      state.user = data.user;
      state.doing = null;
      toast(t("taskOk") + " · " + money(data.reward));
      render();
    } catch (e) {
      toast(e.message, true);
    }
  }

  async function withdraw() {
    try {
      const data = await api("/api/withdraw", {
        method: "POST",
        body: JSON.stringify({
          amount: Number(state.wdAmount),
          method: state.wdMethod,
          wallet: state.wdWallet
        })
      });
      state.user = data.user;
      state.wdAmount = "";
      toast(t("wdOk"));
      render();
    } catch (e) {
      toast(e.message, true);
    }
  }

  function onClick(e) {
    const btn = e.target.closest("[data-act]");
    if (!btn) return;
    const act = btn.dataset.act;
    if (act === "lang") {
      state.lang = state.lang === "bn" ? "en" : "bn";
      store.set("es_lang", state.lang);
      document.documentElement.lang = state.lang === "bn" ? "bn" : "en";
      render();
    }
    if (act === "open-cc") { state.countryOpen = true; render(); }
    if (act === "close-sheet") { state.countryOpen = false; render(); }
    if (act === "pick-cc") {
      state.country = ES.COUNTRIES.find(c => c.code === btn.dataset.code) || state.country;
      state.countryOpen = false;
      render();
    }
    if (act === "start-task") startTask(btn.dataset.id);
    if (act === "close-task") { state.doing = null; render(); }
    if (act === "finish-task") finishTask();
    if (act === "wd-method") { state.wdMethod = btn.dataset.m; render(); }
    if (act === "copy") {
      navigator.clipboard?.writeText(btn.dataset.text);
      toast(t("copied"));
    }
    if (act === "logout") {
      state.token = null;
      state.user = null;
      store.set("es_token", null);
      go("/");
    }
  }

  function onSubmit(e) {
    const form = e.target.closest("form[data-act]");
    if (!form) return;
    e.preventDefault();
    const act = form.dataset.act;
    if (act === "register") register();
    if (act === "login") login();
    if (act === "withdraw") withdraw();
  }

  function needAuth(path) {
    return path.startsWith("/app");
  }

  function patchLive() {
    const users = $("#st-users");
    const paid = $("#st-paid");
    const ticker = $("#live-ticker");
    if (users) users.textContent = state.live.users || 0;
    if (paid) paid.textContent = money(state.live.paid || 0);
    if (ticker) ticker.innerHTML = tickerHtml();
    $$livePills();
  }
  function $$livePills() {
    document.querySelectorAll(".live-pill").forEach(el => {
      const label = el.textContent.includes("live") && !el.textContent.includes("লাইভ") ? "live" : t("liveNow");
      el.innerHTML = `<i></i> ${state.live.online || 0} ${label}`;
    });
  }

  function render() {
    const { path, scroll } = route();
    if (needAuth(path) && !current()) {
      go("/login");
      return;
    }
    const u = current();
    if (path === "/" || path === "") app.innerHTML = landing();
    else if (path === "/login") app.innerHTML = authLayout("login");
    else if (path === "/register") app.innerHTML = authLayout("register");
    else if (path === "/app" || path === "/app/") app.innerHTML = dashHome(u);
    else if (path === "/app/tasks") app.innerHTML = dashTasks(u);
    else if (path === "/app/withdraw") app.innerHTML = dashWithdraw(u);
    else if (path === "/app/refer") app.innerHTML = dashRefer(u);
    else if (path === "/app/profile") app.innerHTML = dashProfile(u);
    else app.innerHTML = landing();

    bindAuthInputs();
    document.documentElement.lang = state.lang === "bn" ? "bn" : "en";
    if (scroll) requestAnimationFrame(() => document.getElementById(scroll)?.scrollIntoView({ behavior: "smooth" }));
  }

  function connectSocket() {
    if (!window.io) return;
    const socket = window.io({ transports: ["polling", "websocket"] });
    window.socket = socket;
    if (state.token) socket.emit("auth", state.token);
    socket.on("stats", s => {
      state.live = { ...state.live, ...s };
      patchLive();
    });
    socket.on("ticker", item => {
      state.live.ticker = [item, ...(state.live.ticker || [])].slice(0, 20);
      patchLive();
    });
    socket.on("me", user => {
      state.user = user;
      const { path } = route();
      if (path.startsWith("/app")) render();
    });
    socket.on("paid", info => {
      toast(t("paid") + " · " + money(info.amount) + " " + info.method);
    });
  }

  async function boot() {
    try {
      const pub = await api("/api/public");
      state.live = { ...state.live, ...pub };
    } catch {}
    if (state.token) {
      try {
        const me = await api("/api/me");
        state.user = me.user;
      } catch {
        state.token = null;
        state.user = null;
        store.set("es_token", null);
      }
    }
    render();
    connectSocket();
  }

  document.addEventListener("click", onClick);
  document.addEventListener("submit", onSubmit);
  window.addEventListener("hashchange", render);
  boot();
})();
