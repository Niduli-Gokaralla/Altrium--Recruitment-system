(function () {
  const API_BASE = "http://localhost:8080/api/notifications";
  const POLL_INTERVAL_MS = 30000;

  function getAuthHeader() {
    const token = sessionStorage.getItem("authToken");
    return token ? { Authorization: "Bearer " + token } : {};
  }

  const username = sessionStorage.getItem("username");
  const role = sessionStorage.getItem("role");
  if (!sessionStorage.getItem("authToken") || !username) return;

  const style = document.createElement("style");
  style.textContent = `
    #altrium-topbar {
      background: #ffffff;
      border-bottom: 1px solid #eee;
      height: 60px;
      display: flex;
      align-items: center;
      justify-content: flex-end;
      padding: 0 24px;
      gap: 18px;
      font-family: "Poppins", "Segoe UI", Arial, sans-serif;
      position: relative;
      z-index: 1500;
      box-shadow: 0 2px 8px rgba(0,0,0,0.06);
    }
    #altrium-topbar-bell {
      position: relative;
      width: 38px;
      height: 38px;
      border-radius: 50%;
      background: #f4f6f8;
      border: none;
      color: #16324f;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: background 0.15s ease;
    }
    #altrium-topbar-bell:hover { background: #eaeef1; }
    #altrium-topbar-bell svg { width: 19px; height: 19px; }
    #altrium-topbar-badge {
      position: absolute;
      top: -3px;
      right: -3px;
      background: #e74c3c;
      color: #fff;
      font-size: 0.6rem;
      font-weight: 700;
      min-width: 17px;
      height: 17px;
      border-radius: 9px;
      border: 2px solid #ffffff;
      display: none;
      align-items: center;
      justify-content: center;
      padding: 0 3px;
      font-family: Arial, sans-serif;
    }
    #altrium-topbar-account {
      display: flex;
      align-items: center;
      gap: 8px;
      cursor: pointer;
      padding: 4px 6px 4px 4px;
      border-radius: 20px;
      transition: background 0.15s ease;
    }
    #altrium-topbar-account:hover { background: #f4f6f8; }
    #altrium-topbar-avatar {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: #f6b93b;
      color: #16324f;
      font-weight: 700;
      font-size: 0.85rem;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    #altrium-topbar-account-text {
      color: #16324f;
      font-size: 0.85rem;
      line-height: 1.15;
    }
    #altrium-topbar-account-text .altrium-topbar-role {
      display: block;
      font-size: 0.7rem;
      color: #8a8a8a;
    }
    #altrium-topbar-chevron {
      color: #16324f;
      transition: transform 0.15s ease;
    }
    #altrium-topbar-chevron.open { transform: rotate(180deg); }

    .altrium-topbar-dropdown {
      position: absolute;
      top: 68px;
      right: 24px;
      background: #fff;
      border-radius: 10px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.2);
      min-width: 180px;
      display: none;
      overflow: hidden;
      font-family: "Poppins", "Segoe UI", Arial, sans-serif;
    }
    .altrium-topbar-dropdown.open { display: block; }
    .altrium-topbar-dropdown button,
    .altrium-topbar-dropdown a {
      display: block;
      width: 100%;
      text-align: left;
      padding: 12px 16px;
      background: none;
      border: none;
      color: #333;
      font-size: 0.87rem;
      text-decoration: none;
      cursor: pointer;
    }
    .altrium-topbar-dropdown button:hover,
    .altrium-topbar-dropdown a:hover {
      background: #f8f9fb;
    }
    .altrium-topbar-dropdown hr {
      margin: 0;
      border: none;
      border-top: 1px solid #eee;
    }

    #altrium-notif-dropdown {
      position: absolute;
      top: 68px;
      right: 90px;
      z-index: 1500;
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
    .altrium-notif-time { font-size: 0.72rem; color: #999; margin-top: 3px; }
    .altrium-notif-empty { padding: 28px 18px; text-align: center; color: #999; font-size: 0.85rem; }
  `;
  document.head.appendChild(style);

  const initial = username.charAt(0).toUpperCase();
  const roleLabelMap = { HR: "HR", HIRING_MANAGER: "Hiring Manager", INTERVIEWER: "Interviewer" };
  const roleLabel = roleLabelMap[role] || role || "";

  const topbar = document.createElement("div");
  topbar.id = "altrium-topbar";
  topbar.innerHTML = `
    <button type="button" id="altrium-topbar-bell" aria-label="Notifications">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"></path>
        <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
      </svg>
      <div id="altrium-topbar-badge"></div>
    </button>

    <div id="altrium-topbar-account">
      <div id="altrium-topbar-avatar">${initial}</div>
      <div id="altrium-topbar-account-text">
        ${username}
        <span class="altrium-topbar-role">${roleLabel}</span>
      </div>
      <svg id="altrium-topbar-chevron" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="6 9 12 15 18 9"></polyline>
      </svg>
    </div>
  `;

  document.body.insertBefore(topbar, document.body.firstChild);

  const accountDropdown = document.createElement("div");
  accountDropdown.className = "altrium-topbar-dropdown";
  accountDropdown.innerHTML = `
    <a href="profile.html" id="altrium-topbar-profile-link">Profile</a>
    <hr>
    <button type="button" id="altrium-topbar-logout-btn">Log out</button>
  `;
  document.body.appendChild(accountDropdown);

  const notifDropdown = document.createElement("div");
  notifDropdown.id = "altrium-notif-dropdown";
  notifDropdown.innerHTML = `
    <div class="altrium-notif-header">
      <span>Notifications</span>
      <button type="button" id="altrium-notif-mark-all">Mark all as read</button>
    </div>
    <div id="altrium-notif-list"></div>
  `;
  document.body.appendChild(notifDropdown);

  const bellBtn = document.getElementById("altrium-topbar-bell");
  const badge = document.getElementById("altrium-topbar-badge");
  const accountBtn = document.getElementById("altrium-topbar-account");
  const chevron = document.getElementById("altrium-topbar-chevron");

  accountBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    notifDropdown.classList.remove("open");
    const isOpen = accountDropdown.classList.toggle("open");
    chevron.classList.toggle("open", isOpen);
  });

  document.getElementById("altrium-topbar-profile-link").addEventListener("click", (e) => {
    accountDropdown.classList.remove("open");
    chevron.classList.remove("open");
  });

  document.getElementById("altrium-topbar-logout-btn").addEventListener("click", () => {
    sessionStorage.clear();
    window.location.href = "login.html";
  });

  document.addEventListener("click", (e) => {
    if (!accountDropdown.contains(e.target) && !accountBtn.contains(e.target)) {
      accountDropdown.classList.remove("open");
      chevron.classList.remove("open");
    }
    if (!notifDropdown.contains(e.target) && !bellBtn.contains(e.target)) {
      notifDropdown.classList.remove("open");
    }
  });

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
      // silent
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
    accountDropdown.classList.remove("open");
    chevron.classList.remove("open");
    const isOpen = notifDropdown.classList.toggle("open");
    if (isOpen) loadList();
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