const API_BASE_URL = "http://localhost:8080/api/auth";

const params = new URLSearchParams(window.location.search);
const token = params.get("token");

const form = document.getElementById("resetForm");
const errorBox = document.getElementById("formError");
const successBox = document.getElementById("formSuccess");
const noTokenMessage = document.getElementById("noTokenMessage");
const submitBtn = document.getElementById("submitBtn");
const btnText = submitBtn.querySelector(".btn-text");
const spinner = document.getElementById("submitSpinner");
const newPasswordInput = document.getElementById("newPassword");
const confirmPasswordInput = document.getElementById("confirmPassword");

if (!token) {
  noTokenMessage.classList.remove("d-none");
  form.classList.add("d-none");
}

[document.getElementById("togglePassword1"), document.getElementById("togglePassword2")].forEach((btn, idx) => {
  const input = idx === 0 ? newPasswordInput : confirmPasswordInput;
  btn.addEventListener("click", () => {
    const isPassword = input.type === "password";
    input.type = isPassword ? "text" : "password";
    btn.querySelector("i").className = isPassword ? "bi bi-eye-slash" : "bi bi-eye";
  });
});

function setLoading(isLoading) {
  submitBtn.disabled = isLoading;
  spinner.classList.toggle("d-none", !isLoading);
  btnText.textContent = isLoading ? "Resetting..." : "Reset Password";
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  errorBox.classList.add("d-none");
  successBox.classList.add("d-none");
  confirmPasswordInput.setCustomValidity("");

  const newPassword = newPasswordInput.value;
  const confirmPassword = confirmPasswordInput.value;

  if (newPassword !== confirmPassword) {
    confirmPasswordInput.setCustomValidity("Passwords do not match.");
  }

  if (!form.checkValidity()) {
    e.stopPropagation();
    form.classList.add("was-validated");
    return;
  }

  setLoading(true);
  try {
    const response = await fetch(`${API_BASE_URL}/reset-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, newPassword }),
    });
    const data = await response.json();

    if (response.ok) {
      successBox.textContent = data.message;
      successBox.classList.remove("d-none");
      form.classList.add("d-none");
      setTimeout(() => { window.location.href = "login.html"; }, 2500);
    } else {
      errorBox.textContent = data.message || Object.values(data).join(" ") || "Could not reset your password. Please try again.";
      errorBox.classList.remove("d-none");
    }
  } catch (err) {
    errorBox.textContent = "Unable to reach the server. Please try again later.";
    errorBox.classList.remove("d-none");
  } finally {
    setLoading(false);
  }
});
