// Reelay dashboard — fetches live data from the API, falls back to demo data
// so the page is presentable before the backend has any accounts.

const API = window.REELAY_API_BASE || "";

const DEMO = {
  overview: {
    pipeline: [
      { key: "scanned", label: "Scanned", count: 32 },
      { key: "downloaded", label: "Downloaded", count: 57 },
      { key: "drive", label: "In Drive", count: 57 },
      { key: "scheduled", label: "Scheduled", count: 41 },
      { key: "published", label: "Published", count: 28 },
    ],
    videos_today: 57,
    scheduled_ahead: 41,
    published_this_week: 146,
    proxy_health_pct: 96,
    sources_total: 32,
    sources_healthy: 30,
  },
  sources: [
    { username: "travel.hues", status: "healthy", last_scanned_at: "6 min ago", proxy_group: "eu-res-01", _new: 12 },
    { username: "fit.daily", status: "healthy", last_scanned_at: "6 min ago", proxy_group: "eu-res-01", _new: 8 },
    { username: "cook.knacks", status: "cooldown", last_scanned_at: "1 h ago", proxy_group: "us-res-03", _new: 0 },
    { username: "auto.vault", status: "healthy", last_scanned_at: "7 min ago", proxy_group: "eu-res-02", _new: 15 },
    { username: "meme.motion", status: "rate_limited", last_scanned_at: "2 h ago", proxy_group: "us-res-01", _new: 0 },
    { username: "pet.grams", status: "healthy", last_scanned_at: "6 min ago", proxy_group: "eu-res-02", _new: 10 },
  ],
};

const STAGE_ICON = {
  scanned: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg>',
  downloaded: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3v12"/><path d="m7 12 5 5 5-5"/><path d="M5 21h14"/></svg>',
  drive: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m4 8 8-4 8 4-8 4-8-4Z"/><path d="m4 12 8 4 8-4"/></svg>',
  scheduled: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="17" rx="2"/><path d="M3 9h18M8 2v4M16 2v4"/></svg>',
  published: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6 9 17l-5-5"/></svg>',
};
const STAGE_CLASS = { scanned: "i-scan", downloaded: "i-dl", drive: "i-drive", scheduled: "i-sched", published: "i-pub" };
const STATUS_PILL = { healthy: "p-good", cooldown: "p-warn", rate_limited: "p-crit", disabled: "p-warn" };
const STATUS_LABEL = { healthy: "healthy", cooldown: "cooldown", rate_limited: "rate-limited", disabled: "disabled" };

async function getJSON(path) {
  const res = await fetch(`${API}${path}`, { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error(res.status);
  return res.json();
}

function initials(name) {
  const parts = name.replace(/[@._]/g, " ").trim().split(/\s+/);
  return ((parts[0]?.[0] || "") + (parts[1]?.[0] || parts[0]?.[1] || "")).toUpperCase();
}
function avatarColor(name) {
  const hues = ["#f7778c,#e5417a", "#6a5acd,#3aa0ff", "#f2b34b,#e5417a", "#4fd188,#0f9e90", "#ff6a60,#b23c8f", "#9b7bff,#e5417a"];
  let h = 0;
  for (const c of name) h = (h + c.charCodeAt(0)) % hues.length;
  return hues[h];
}

function renderPipeline(pipeline) {
  const el = document.getElementById("flow");
  el.innerHTML = pipeline.map((s) => `
    <div class="stage">
      <div class="stage-ico ${STAGE_CLASS[s.key] || "i-scan"}">${STAGE_ICON[s.key] || ""}</div>
      <h3>${s.label}</h3>
      <div class="count">${s.count}</div>
    </div>`).join("");
}

function renderStats(o) {
  document.getElementById("stat-videos").textContent = o.videos_today;
  document.getElementById("stat-scheduled").textContent = o.scheduled_ahead;
  document.getElementById("stat-published").textContent = o.published_this_week;
  document.getElementById("stat-proxy").textContent = o.proxy_health_pct + "%";
}

function renderSources(rows) {
  const tbody = document.getElementById("sources-body");
  tbody.innerHTML = rows.map((r) => {
    const last = typeof r.last_scanned_at === "string" && r.last_scanned_at.includes("ago")
      ? r.last_scanned_at
      : (r.last_scanned_at ? new Date(r.last_scanned_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—");
    return `
    <tr>
      <td><div class="acct">
        <div class="ava" style="background:linear-gradient(135deg,${avatarColor(r.username)})">${initials(r.username)}</div>
        <div><b>@${r.username}</b><span>${r.proxy_group}</span></div>
      </div></td>
      <td><span class="pill ${STATUS_PILL[r.status] || "p-warn"}">${STATUS_LABEL[r.status] || r.status}</span></td>
      <td class="num">${last}</td>
      <td class="num">${r._new ?? "—"}</td>
      <td class="num">${r.proxy_group}</td>
    </tr>`;
  }).join("");
}

async function load() {
  let live = false;
  let overview = DEMO.overview, sources = DEMO.sources;
  try {
    overview = await getJSON("/api/overview");
    const s = await getJSON("/api/sources");
    if (Array.isArray(s) && s.length) sources = s;
    live = true;
  } catch (_) {
    live = false; // backend not reachable yet — show demo data
  }
  renderPipeline(overview.pipeline);
  renderStats(overview);
  renderSources(sources);
  document.getElementById("nav-sources").textContent = overview.sources_total ?? sources.length;

  const badge = document.getElementById("data-mode");
  badge.textContent = live ? "live" : "demo data";
  badge.className = "live-badge " + (live ? "on" : "off");
}

// Theme toggle
document.getElementById("themeBtn").addEventListener("click", () => {
  const root = document.documentElement;
  const cur = root.getAttribute("data-theme") ||
    (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
  root.setAttribute("data-theme", cur === "dark" ? "light" : "dark");
});

// Countdown to the next hourly scan (top of the hour)
setInterval(() => {
  const now = new Date();
  const secs = 3600 - (now.getMinutes() * 60 + now.getSeconds());
  const m = String(Math.floor(secs / 60)).padStart(2, "0");
  const s = String(secs % 60).padStart(2, "0");
  document.getElementById("countdown").textContent = `${m}:${s}`;
}, 1000);

load();
