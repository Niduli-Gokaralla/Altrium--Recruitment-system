const API_BASE_URL = "http://localhost:8080/api/auth";

// Filenames match exactly what login.js redirects to — no mismatches.
const ROLE_DASHBOARDS = {
  HR: "hr-dashboard.html",
  HIRING_MANAGER: "hiring-manager-dashboard.html",
  INTERVIEWER: "interviewer-dashboard.html",
};

const form = document.getElementById("loginForm");
const errorBox = document.getElementById("loginError");
const loginBtn = document.getElementById("loginBtn");
const btnText = loginBtn.querySelector(".btn-text");
const spinner = document.getElementById("loginSpinner");
const toggleBtn = document.getElementById("togglePassword");
const passwordInput = document.getElementById("password");

toggleBtn.addEventListener("click", () => {
  const isPassword = passwordInput.type === "password";
  passwordInput.type = isPassword ? "text" : "password";
  toggleBtn.querySelector("i").className = isPassword ? "bi bi-eye-slash" : "bi bi-eye";
});

function showError(message) {
  errorBox.textContent = message;
  errorBox.classList.remove("d-none");
}

function hideError() {
  errorBox.classList.add("d-none");
}

function setLoading(isLoading) {
  loginBtn.disabled = isLoading;
  spinner.classList.toggle("d-none", !isLoading);
  btnText.textContent = isLoading ? "Logging in..." : "Log In";
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  hideError();

  if (!form.checkValidity()) {
    e.stopPropagation();
    form.classList.add("was-validated");
    return;
  }

  const username = document.getElementById("username").value.trim();
  const password = passwordInput.value;

  setLoading(true);
  try {
    const response = await fetch(`${API_BASE_URL}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      showError(data.message || "Invalid username or password.");
      return;
    }

    const dashboardPage = ROLE_DASHBOARDS[data.role];
    if (!dashboardPage) {
      showError("Access denied: this account does not have a recognized role.");
      return;
    }

    sessionStorage.setItem("authToken", data.token);
    sessionStorage.setItem("username", data.username);
    sessionStorage.setItem("role", data.role);

    window.location.href = dashboardPage;
  } catch (err) {
    showError("Unable to reach the server. Please try again later.");
  } finally {
    setLoading(false);
  }
});
