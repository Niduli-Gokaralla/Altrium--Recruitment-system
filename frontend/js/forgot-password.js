const API_BASE_URL = "http://localhost:8080/api/auth";

const form = document.getElementById("forgotForm");
const errorBox = document.getElementById("formError");
const successBox = document.getElementById("formSuccess");
const submitBtn = document.getElementById("submitBtn");
const btnText = submitBtn.querySelector(".btn-text");
const spinner = document.getElementById("submitSpinner");

function setLoading(isLoading) {
  submitBtn.disabled = isLoading;
  spinner.classList.toggle("d-none", !isLoading);
  btnText.textContent = isLoading ? "Sending..." : "Send Reset Link";
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  errorBox.classList.add("d-none");
  successBox.classList.add("d-none");

  if (!form.checkValidity()) {
    e.stopPropagation();
    form.classList.add("was-validated");
    return;
  }

  const username = document.getElementById("username").value.trim();

  setLoading(true);
  try {
    const response = await fetch(`${API_BASE_URL}/forgot-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username }),
    });
    const data = await response.json();

    // Same message shown whether or not the account actually exists —
    // this is deliberate, not a bug, so the form can't be used to guess
    // valid usernames.
    if (response.ok) {
      successBox.textContent = data.message;
      successBox.classList.remove("d-none");
      form.reset();
      form.classList.remove("was-validated");
    } else {
      errorBox.textContent = data.message || "Something went wrong. Please try again.";
      errorBox.classList.remove("d-none");
    }
  } catch (err) {
    errorBox.textContent = "Unable to reach the server. Please try again later.";
    errorBox.classList.remove("d-none");
  } finally {
    setLoading(false);
  }
});
