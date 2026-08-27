// Shared across all Interviewer pages.
const INT_API = "http://localhost:8080/api/interviewer";

function getAuthHeader() {
  const token = sessionStorage.getItem("authToken");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function guardIntAccess() {
  const token = sessionStorage.getItem("authToken");
  const role = sessionStorage.getItem("role");
  const username = sessionStorage.getItem("username");
  const guardMessage = document.getElementById("guardMessage");
  const content = document.getElementById("pageContent") || document.getElementById("dashboardContent");

  if (!token || role !== "INTERVIEWER") {
    if (guardMessage) {
      guardMessage.textContent = "You must be logged in as an Interviewer to view this page.";
      guardMessage.classList.remove("d-none");
    }
    return false;
  }

  const initial = username ? username.charAt(0).toUpperCase() : "I";
  const sidebarAvatar = document.getElementById("sidebarAvatar");
  const sidebarUsername = document.getElementById("sidebarUsername");
  if (sidebarAvatar) sidebarAvatar.textContent = initial;
  if (sidebarUsername) sidebarUsername.textContent = username;

  const welcomeName = document.getElementById("welcomeName");
  if (welcomeName) welcomeName.textContent = username;

  if (content) content.classList.remove("d-none");
  return true;
}

document.addEventListener("DOMContentLoaded", () => {
  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      sessionStorage.clear();
      window.location.href = "login.html";
    });
  }
});

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str == null ? "" : str;
  return div.innerHTML;
}

function formatDate(value) {
  if (!value) return "";
  const d = new Date(value + "T00:00:00");
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function formatShortDate(value) {
  if (!value) return "";
  const d = new Date(value + "T00:00:00");
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function formatTime(value) {
  if (!value) return "";
  const [h, m] = value.split(":");
  const d = new Date();
  d.setHours(Number(h), Number(m));
  return d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

function formatDateTime(value) {
  if (!value) return "";
  return new Date(value).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

const STAGE_LABELS = {
  APPLIED: "Applied",
  SCREENING: "Screening",
  SHORTLISTED: "Shortlisted",
  NOT_SHORTLISTED: "Not Shortlisted",
  INTERVIEW: "Interview",
  HIRED: "Hired",
  REJECTED: "Rejected",
};
