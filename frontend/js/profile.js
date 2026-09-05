const AUTH_API = "http://localhost:8080/api/auth";

const guardMessage = document.getElementById("guardMessage");
const pageContent = document.getElementById("pageContent");

function getAuthHeader() {
  const token = sessionStorage.getItem("authToken");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function guardAccess() {
  const token = sessionStorage.getItem("authToken");
  if (!token) {
    guardMessage.textContent = "You must be logged in to view this page.";
    guardMessage.classList.remove("d-none");
    return false;
  }
  pageContent.classList.remove("d-none");
  return true;
}

const roleLabelMap = { HR: "HR", HIRING_MANAGER: "Hiring Manager", INTERVIEWER: "Interviewer" };

async function loadProfile() {
  try {
    const response = await fetch(`${AUTH_API}/me`, { headers: { ...getAuthHeader() } });
    if (!response.ok) throw new Error("Failed to load profile");
    const profile = await response.json();

    document.getElementById("profileAvatar").textContent = profile.username.charAt(0).toUpperCase();
    document.getElementById("profileUsername").textContent = profile.username;
    document.getElementById("profileRole").textContent = roleLabelMap[profile.role] || profile.role;
    document.getElementById("emailInput").value = profile.email || "";
  } catch (err) {
    guardMessage.textContent = "Could not load your profile. Please refresh the page.";
    guardMessage.classList.remove("d-none");
    pageContent.classList.add("d-none");
  }
}

// --- Email update ---
const emailForm = document.getElementById("emailForm");
const emailError = document.getElementById("emailError");
const emailSuccess = document.getElementById("emailSuccess");
const emailSubmitBtn = document.getElementById("emailSubmitBtn");

emailForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  emailError.classList.add("d-none");
  emailSuccess.classList.add("d-none");
  emailForm.classList.remove("was-validated");

  if (!emailForm.checkValidity()) {
    emailForm.classList.add("was-validated");
    return;
  }

  emailSubmitBtn.disabled = true;
  document.getElementById("emailSpinner").classList.remove("d-none");

  try {
    const response = await fetch(`${AUTH_API}/email`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...getAuthHeader() },
      body: JSON.stringify({ email: document.getElementById("emailInput").value.trim() }),
    });
    const data = await response.json();

    if (!response.ok) {
      emailError.textContent = data.message || Object.values(data).join(" ") || "Could not update your email.";
      emailError.classList.remove("d-none");
      return;
    }

    emailSuccess.textContent = data.message;
    emailSuccess.classList.remove("d-none");
  } catch (err) {
    emailError.textContent = "Unable to reach the server. Please try again later.";
    emailError.classList.remove("d-none");
  } finally {
    emailSubmitBtn.disabled = false;
    document.getElementById("emailSpinner").classList.add("d-none");
  }
});

// --- Change password ---
const passwordForm = document.getElementById("passwordForm");
const passwordError = document.getElementById("passwordError");
const passwordSuccess = document.getElementById("passwordSuccess");
const passwordSubmitBtn = document.getElementById("passwordSubmitBtn");
const newPasswordInput = document.getElementById("newPassword");
const confirmNewPasswordInput = document.getElementById("confirmNewPassword");

passwordForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  passwordError.classList.add("d-none");
  passwordSuccess.classList.add("d-none");
  confirmNewPasswordInput.setCustomValidity("");

  if (newPasswordInput.value !== confirmNewPasswordInput.value) {
    confirmNewPasswordInput.setCustomValidity("Passwords do not match.");
  }

  if (!passwordForm.checkValidity()) {
    passwordForm.classList.add("was-validated");
    return;
  }

  passwordSubmitBtn.disabled = true;
  document.getElementById("passwordSpinner").classList.remove("d-none");

  try {
    const response = await fetch(`${AUTH_API}/change-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...getAuthHeader() },
      body: JSON.stringify({
        currentPassword: document.getElementById("currentPassword").value,
        newPassword: newPasswordInput.value,
      }),
    });
    const data = await response.json();

    if (!response.ok) {
      passwordError.textContent = data.message || Object.values(data).join(" ") || "Could not change your password.";
      passwordError.classList.remove("d-none");
      return;
    }

    passwordSuccess.textContent = data.message;
    passwordSuccess.classList.remove("d-none");
    passwordForm.reset();
    passwordForm.classList.remove("was-validated");
  } catch (err) {
    passwordError.textContent = "Unable to reach the server. Please try again later.";
    passwordError.classList.remove("d-none");
  } finally {
    passwordSubmitBtn.disabled = false;
    document.getElementById("passwordSpinner").classList.add("d-none");
  }
});

if (guardAccess()) {
  loadProfile();
}
