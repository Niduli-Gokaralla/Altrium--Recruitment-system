/**
 * Altrium Notification Bell — self-contained widget (v2).
 *
 * Usage: add ONE line before </body> on any page that already has
 * sessionStorage.authToken set:
 *
 *   <script src="js/notifications.js"></script>
 *
 * This version automatically detects existing content in the top-right
 * corner of the page (e.g. a "Signed in as..." badge) and positions
 * itself to avoid overlapping it.
 */
(function () {
  const API_BASE = "http://localhost:8080/api/notifications";
  const POLL_INTERVAL_MS = 30000;

  function getAuthHeader() {
    const token = sessionStorage.getItem("authToken");
    return token ? { Authorization: "Bearer " + token } : {};
  }

  if (!sessionStorage.getItem("authToken")) return;

  const style = document.createElement("style");
  style.textContent = `
    #altrium-notif-bell-btn {
      position: fixed;
      z-index: 2000;
      width: 44px;
      height: 44px;
      border-radius: 50%;
      background: #16324f;
      border: 2px solid #ffffff;
      color: #f6b93b;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      box-shadow: 0 3px 10px rgba(0,0,0,0.22);
      transition: transform 0.15s ease, background 0.15s ease;
    }
    #altrium-notif-bell-btn:hover {
      background: #0b2038;
      transform: translateY(-1px);
    }
    #altrium-notif-bell-btn svg { width: 20px; height: 20px; }
    #altrium-notif-badge {
      position: absolute;
      top: -4px;
      right: -4px;
      background: #e74c3c;
      color: #fff;
      font-size: 0.62rem;
      font-weight: 700;
      min-width: 19px;
      height: 19px;
      border-radius: 10px;
      border: 2px solid #ffffff;
      display: none;
      align-items: center;
      justify-content: center;
      padding: 0 4px;
      font-family: Arial, sans-serif;
    }
    #altrium-notif-dropdown {
      position: fixed;
      z-index: 2000;
      width: 340px;
      max-height: 420px;
      overflow-y: auto;
      background: #fff;
      border-radius: 14px;
      box-shadow: 0 10px 34px rgba(0,0,0,0.22);
      display: none;
      font-family: "Poppins", "Segoe UI", Arial, sans-serif;
    }
    #altrium-notif-dropdown.open { display: block; }
    .altrium-notif-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 14px 18px;
      border-bottom: 1px solid #eee;
      font-weight: 600;
      color: #16324f;
      font-size: 0.95rem;
    }
    .altrium-notif-header button {
      background: none;
      border: none;
      color: #16324f;
      font-size: 0.76rem;
      text-decoration: underline;
      cursor: pointer;
      padding: 0;
    }
    .altrium-notif-item {
      padding: 13px 18px;
      border-bottom: 1px solid #f2f2f2;
      cursor: pointer;
      font-size: 0.85rem;
      color: #333;
      display: flex;
      gap: 10px;
      align-items: flex-start;
      transition: background 0.12s ease;
    }
    .altrium-notif-item:hover { background: #f8f9fb; }
    .altrium-notif-item.unread { background: #fffaf0; }
    .altrium-notif-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #f6b93b;
      margin-top: 5px;
      flex-shrink: 0;
    }
    .altrium-notif-item.read .altrium-notif-dot { background: transparent; }
    .altrium-notif-time {
      font-size: 0.72rem;
      color: #999;
      margin-top: 3px;
    }
    .altrium-notif-empty {
      padding: 28px 18px;
      text-align: center;
      color: #999;
      font-size: 0.85rem;
    }
  `;
  document.head.appendChild(style);

  const bellBtn = document.createElement("button");
  bellBtn.id = "altrium-notif-bell-btn";
  bellBtn.type = "button";
  bellBtn.setAttribute("aria-label", "Notifications");
  bellBtn.innerHTML = `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"></path>
      <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
    </svg>
    <div id="altrium-notif-badge"></div>
  `;

  const dropdown = document.createElement("div");
  dropdown.id = "altrium-notif-dropdown";
  dropdown.innerHTML = `
    <div class="altrium-notif-header">
      <span>Notifications</span>
      <button type="button" id="altrium-notif-mark-all">Mark all as read</button>
    </div>
    <div id="altrium-notif-list"></div>
  `;

  document.body.appendChild(bellBtn);
  document.body.appendChild(dropdown);
  const badge = document.getElementById("altrium-notif-badge");

  // --- Smart positioning: avoid overlapping anything already sitting in
  // the page's top-right corner (e.g. a "Signed in as..." badge). Scans
  // for existing elements in that zone and places the bell just below
  // the lowest one found, or in the default corner spot if nothing's
  // there.
  function positionBell() {
    const margin = 16;
    const zoneWidth = 340;
    const zoneHeight = 110;
    const maxCandidateHeight = 70;   // only small badge/button-sized elements
    const maxCandidateWidth = 340;   // exclude full-width containers/bars
    let lowestBottom = 0;

    document.querySelectorAll("body *").forEach((el) => {
      if (el === bellBtn || el === dropdown || bellBtn.contains(el) || dropdown.contains(el)) return;
      const rect = el.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      // Skip large structural elements (sidebars, full-width headers,
      // the whole page body) — we only want small badge-like content
      // actually sitting in the corner, not entire containers that
      // merely happen to start near the top.
      if (rect.height > maxCandidateHeight || rect.width > maxCandidateWidth) return;
      const inTopRightZone =
        rect.top < zoneHeight &&
        rect.right > window.innerWidth - zoneWidth &&
        rect.left < window.innerWidth;
      if (inTopRightZone && rect.bottom > lowestBottom) {
        lowestBottom = rect.bottom;
      }
    });

    // Safety cap: never push the bell further than ~140px from the top,
    // even if something unexpected is detected — keeps it always visible
    // in the corner rather than potentially drifting off-screen.
    const top = lowestBottom > 0 ? Math.min(lowestBottom + margin, 140) : margin;
    bellBtn.style.top = top + "px";
    bellBtn.style.right = margin + "px";
  }

  function positionDropdown() {
    const bellRect = bellBtn.getBoundingClientRect();
    dropdown.style.top = bellRect.bottom + 10 + "px";
    dropdown.style.right = (window.innerWidth - bellRect.right) + "px";
  }

  // Run once shortly after the rest of the page has rendered (so we can
  // actually see other elements' positions), then keep it correct on
  // resize.
  setTimeout(positionBell, 150);
  window.addEventListener("resize", positionBell);

  function timeAgo(dateString) {
    const seconds = Math.floor((new Date() - new Date(dateString)) / 1000);
    if (seconds < 60) return "just now";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return minutes + "m ago";
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return hours + "h ago";
    const days = Math.floor(hours / 24);
    return days + "d ago";
  }

  function escapeHtml(str) {
    if (str === null || str === undefined) return "";
    return String(str).replace(/[&<>"']/g, (c) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
    }[c]));
  }

  async function refreshUnreadCount() {
    try {
      const res = await fetch(`${API_BASE}/unread-count`, { headers: { ...getAuthHeader() } });
      if (!res.ok) return;
      const data = await res.json();
      if (data.unreadCount > 0) {
        badge.textContent = data.unreadCount > 99 ? "99+" : String(data.unreadCount);
        badge.style.display = "flex";
      } else {
        badge.style.display = "none";
      }
    } catch (err) {
      // silent — notifications are non-critical, don't disrupt the page
    }
  }

  async function loadList() {
    const list = document.getElementById("altrium-notif-list");
    list.innerHTML = `<div class="altrium-notif-empty">Loading...</div>`;
    try {
      const res = await fetch(API_BASE, { headers: { ...getAuthHeader() } });
      if (!res.ok) throw new Error("Failed to load");
      const notifications = await res.json();

      if (!notifications.length) {
        list.innerHTML = `<div class="altrium-notif-empty">No notifications yet.</div>`;
        return;
      }

      list.innerHTML = notifications.map((n) => `
        <div class="altrium-notif-item ${n.read ? "read" : "unread"}" data-id="${n.id}">
          <div class="altrium-notif-dot"></div>
          <div>
            <div>${escapeHtml(n.message)}</div>
            <div class="altrium-notif-time">${timeAgo(n.createdAt)}</div>
          </div>
        </div>
      `).join("");

      list.querySelectorAll(".altrium-notif-item.unread").forEach((el) => {
        el.addEventListener("click", async () => {
          const id = el.dataset.id;
          try {
            await fetch(`${API_BASE}/${id}/read`, { method: "PATCH", headers: { ...getAuthHeader() } });
            el.classList.remove("unread");
            el.classList.add("read");
            refreshUnreadCount();
          } catch (err) {
            // ignore
          }
        });
      });
    } catch (err) {
      list.innerHTML = `<div class="altrium-notif-empty">Could not load notifications.</div>`;
    }
  }

  bellBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    const isOpen = dropdown.classList.contains("open");
    if (isOpen) {
      dropdown.classList.remove("open");
    } else {
      positionDropdown();
      dropdown.classList.add("open");
      loadList();
    }
  });

  document.addEventListener("click", (e) => {
    if (!dropdown.contains(e.target) && e.target !== bellBtn && !bellBtn.contains(e.target)) {
      dropdown.classList.remove("open");
    }
  });

  document.getElementById("altrium-notif-mark-all").addEventListener("click", async () => {
    try {
      await fetch(`${API_BASE}/read-all`, { method: "PATCH", headers: { ...getAuthHeader() } });
      loadList();
      refreshUnreadCount();
    } catch (err) {
      // ignore
    }
  });

  refreshUnreadCount();
  setInterval(refreshUnreadCount, POLL_INTERVAL_MS);
})();
