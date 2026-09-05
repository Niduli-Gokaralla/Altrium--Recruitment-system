const CANDIDATES_API = "http://localhost:8080/api/hr/candidates";
const JOBS_API = "http://localhost:8080/api/hr/jobs";

const guardMessage = document.getElementById("guardMessage");
const pageContent = document.getElementById("pageContent");
const logoutBtn = document.getElementById("logoutBtn");

let allCandidates = [];
let allJobs = [];

function getAuthHeader() {
  const token = sessionStorage.getItem("authToken");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function guardHrAccess() {
  const token = sessionStorage.getItem("authToken");
  const role = sessionStorage.getItem("role");
  const username = sessionStorage.getItem("username");

  if (!token || role !== "HR") {
    guardMessage.textContent = "You must be logged in as an HR user to view this page.";
    guardMessage.classList.remove("d-none");
    return false;
  }

  const initial = username ? username.charAt(0).toUpperCase() : "H";
  const sidebarAvatar = document.getElementById("sidebarAvatar");
  const sidebarUsername = document.getElementById("sidebarUsername");
  if (sidebarAvatar) sidebarAvatar.textContent = initial;
  if (sidebarUsername) sidebarUsername.textContent = username;

  pageContent.classList.remove("d-none");
  return true;
}

if (logoutBtn) {
  logoutBtn.addEventListener("click", () => {
    sessionStorage.clear();
    window.location.href = "login.html";
  });
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str || "";
  return div.innerHTML;
}

function stageLabel(stage) {
  return (
    {
      APPLIED: "Applied",
      SCREENING: "Screening",
      SHORTLISTED: "Shortlisted",
      NOT_SHORTLISTED: "Not Shortlisted",
      INTERVIEW: "Interview",
      HIRED: "Hired",
      REJECTED: "Rejected",
    }[stage] || stage
  );
}

function formatDate(value) {
  if (!value) return "";
  const d = new Date(value);
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function formatFileSize(bytes) {
  if (!bytes) return "";
  const kb = bytes / 1024;
  return kb > 1024 ? (kb / 1024).toFixed(1) + " MB" : Math.round(kb) + " KB";
}

// ---------------------------------------------------------------------
// Open candidate CV
// ---------------------------------------------------------------------

async function openCv(id, filename) {
  try {
    const response = await fetch(`${CANDIDATES_API}/${id}/cv`, { headers: { ...getAuthHeader() } });
    if (!response.ok) throw new Error("Could not load CV");
    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);
    window.open(blobUrl, "_blank");
    setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
  } catch (err) {
    alert("Could not open the CV. Please try again.");
  }
}

// ---------------------------------------------------------------------
// Loading data
// ---------------------------------------------------------------------

async function loadJobsForDropdowns() {
  try {
    const response = await fetch(JOBS_API, { headers: { ...getAuthHeader() } });
    if (!response.ok) throw new Error("Failed to load job openings");
    allJobs = await response.json();

    const positionFilter = document.getElementById("positionFilter");
    const formSelect = document.getElementById("jobOpeningId");
    const options = allJobs.map((j) => `<option value="${j.id}">${escapeHtml(j.title)}</option>`).join("");

    if (positionFilter) positionFilter.innerHTML = '<option value="">All positions</option>' + options;
    if (formSelect) formSelect.innerHTML = '<option value="">Select a job opening...</option>' + options;
  } catch (err) {
    // Non-fatal — dropdowns just stay empty
  }
}

async function loadCandidates() {
  const loading = document.getElementById("candidatesLoading");
  const empty = document.getElementById("candidatesEmpty");
  const table = document.getElementById("candidatesTable");

  loading.classList.remove("d-none");
  empty.classList.add("d-none");
  table.classList.add("d-none");

  try {
    const response = await fetch(CANDIDATES_API, { headers: { ...getAuthHeader() } });
    if (!response.ok) throw new Error("Failed to load candidates");
    allCandidates = await response.json();
    applyFilters();
  } catch (err) {
    empty.textContent = "Could not load candidates. Please refresh the page.";
    empty.classList.remove("d-none");
  } finally {
    loading.classList.add("d-none");
  }
}

// ---------------------------------------------------------------------
// Filtering
// ---------------------------------------------------------------------

function applyFilters() {
  const search = document.getElementById("searchInput").value.trim().toLowerCase();
  const position = document.getElementById("positionFilter").value;
  const stage = document.getElementById("stageFilter").value;

  const filtered = allCandidates.filter((c) => {
    const matchesSearch = !search || (c.fullName || "").toLowerCase().includes(search);
    const matchesPosition = !position || String(c.jobOpeningId) === position;
    const matchesStage = !stage || c.stage === stage;
    return matchesSearch && matchesPosition && matchesStage;
  });

  renderTable(filtered);
}

document.getElementById("searchInput").addEventListener("input", applyFilters);
document.getElementById("positionFilter").addEventListener("change", applyFilters);
document.getElementById("stageFilter").addEventListener("change", applyFilters);
document.getElementById("clearFiltersBtn").addEventListener("click", () => {
  document.getElementById("searchInput").value = "";
  document.getElementById("positionFilter").value = "";
  document.getElementById("stageFilter").value = "";
  applyFilters();
});

// ---------------------------------------------------------------------
// Table rendering
// ---------------------------------------------------------------------

function renderTable(candidates) {
  const tbody = document.getElementById("candidatesTableBody");
  const table = document.getElementById("candidatesTable");
  const empty = document.getElementById("candidatesEmpty");

  tbody.innerHTML = "";

  if (!candidates || candidates.length === 0) {
    table.classList.add("d-none");
    empty.classList.remove("d-none");
    return;
  }

  empty.classList.add("d-none");
  table.classList.remove("d-none");

  candidates.forEach((c) => {
    const tr = document.createElement("tr");
    const stageClass = "stage-" + c.stage.toLowerCase();
    const cvCell = c.hasCv
      ? `<button type="button" class="cv-link btn btn-link p-0" data-action="view-cv" data-id="${c.id}"><i class="bi bi-file-earmark-text"></i> View CV</button>`
      : `<span class="no-cv">No CV</span>`;

    tr.innerHTML = `
      <td class="job-title-cell">${escapeHtml(c.fullName)}</td>
      <td>${escapeHtml(c.jobOpeningTitle)}</td>
      <td><span class="stage-pill ${stageClass}">${stageLabel(c.stage)}</span></td>
      <td>${cvCell}</td>
      <td>${formatDate(c.createdAt)}</td>
      <td class="text-end">
        <button class="action-btn" title="View" data-action="view" data-id="${c.id}"><i class="bi bi-eye"></i></button>
        <button class="action-btn" title="Edit" data-action="edit" data-id="${c.id}"><i class="bi bi-pencil"></i></button>
        <button class="action-btn text-danger" title="Delete" data-action="delete" data-id="${c.id}"><i class="bi bi-trash"></i></button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

document.getElementById("candidatesTableBody").addEventListener("click", (e) => {
  const cvBtn = e.target.closest('[data-action="view-cv"]');
  if (cvBtn) {
    openCv(Number(cvBtn.dataset.id));
    return;
  }
  const btn = e.target.closest(".action-btn");
  if (!btn) return;
  const id = Number(btn.dataset.id);
  const action = btn.dataset.action;
  if (action === "view") openView(id);
  if (action === "edit") openEditForm(id);
  if (action === "delete") deleteCandidate(id);
});

// ---------------------------------------------------------------------
// Two-step Add Candidate flow
// ---------------------------------------------------------------------

function showStep1() {
  document.getElementById("stepJobCv").classList.remove("d-none");
  document.getElementById("stepDetails").classList.add("d-none");
}

function showStep2() {
  document.getElementById("stepJobCv").classList.add("d-none");
  document.getElementById("stepDetails").classList.remove("d-none");

  const jobSelect = document.getElementById("jobOpeningId");
  const jobText = jobSelect.options[jobSelect.selectedIndex]?.text || "";
  const cvInput = document.getElementById("cvFile");
  const cvText = cvInput.files.length > 0 ? cvInput.files[0].name : "no CV attached";
  document.getElementById("step2ContextNote").innerHTML =
    `<strong>Position:</strong> ${escapeHtml(jobText)} &nbsp;·&nbsp; <strong>CV:</strong> ${escapeHtml(cvText)}`;
}

document.getElementById("continueToStep2Btn").addEventListener("click", () => {
  const jobSelect = document.getElementById("jobOpeningId");
  if (!jobSelect.value) {
    jobSelect.classList.add("is-invalid");
    return;
  }
  jobSelect.classList.remove("is-invalid");
  showStep2();
});

document.getElementById("backToStep1Btn").addEventListener("click", () => {
  showStep1();
});

// ---------------------------------------------------------------------
// Pre-screen candidate before saving
// ---------------------------------------------------------------------

async function checkMatchBeforeSaving() {
  const container = document.getElementById("preScreenResult");
  const jobOpeningId = document.getElementById("jobOpeningId").value;
  const cvInput = document.getElementById("cvFile");

  if (!jobOpeningId) {
    container.innerHTML = `<div class="alert alert-warning py-2 small">Select an Applied Position first.</div>`;
    return;
  }

  const formData = new FormData();
  formData.append("jobOpeningId", jobOpeningId);
  if (cvInput.files.length > 0) formData.append("cvFile", cvInput.files[0]);

  container.innerHTML = `<div class="text-muted small">Checking match...</div>`;

  try {
    const response = await fetch(`${CANDIDATES_API}/pre-screen`, {
      method: "POST",
      headers: { ...getAuthHeader() },
      body: formData,
    });

    if (!response.ok) throw new Error("Pre-screen failed");

    const result = await response.json();
    const skillMatches = Array.isArray(result.skillMatches) ? result.skillMatches : [];

    const skillsHtml = skillMatches.map((s) => `
      <span class="badge ${s.matched ? "bg-success" : "bg-secondary"} me-1 mb-1">
        <i class="bi ${s.matched ? "bi-check" : "bi-x"}"></i> ${escapeHtml(s.skill)}
      </span>
    `).join("");

    const recommendationBadge = result.recommendation === "SHORTLIST"
      ? `<span class="badge bg-success">Looks like a good match</span>`
      : `<span class="badge bg-danger">Below cutoff</span>`;

    const sourceNote = result.sourceUsed === "CV"
      ? "Based on the attached CV."
      : `Based on the typed-in fields (not the CV) — ${escapeHtml(result.extractionMessage || "")}`;

    container.innerHTML = `
      <div class="card border-0" style="background:#f8f9fb;">
        <div class="card-body p-3">
          <div class="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-2">
            <div>
              <span style="font-weight:700; font-size:1.1rem;">${result.matchScorePercent}%</span>
              <span class="text-muted small"> match (cutoff: ${result.cutoffScore}%)</span>
            </div>
            ${recommendationBadge}
          </div>
          <div class="mb-2">
            ${skillsHtml || `<span class="text-muted small">No required skills listed on this job opening.</span>`}
          </div>
          <div class="text-muted" style="font-size:0.75rem;">
            ${sourceNote} Nothing has been saved yet — decide below whether to continue adding this candidate.
          </div>
        </div>
      </div>
    `;
  } catch (err) {
    container.innerHTML = `<div class="alert alert-danger py-2 small">Could not check the match. Please try again.</div>`;
  }
}

document.getElementById("checkMatchBtn").addEventListener("click", checkMatchBeforeSaving);

// ---------------------------------------------------------------------
// Create / Edit form
// ---------------------------------------------------------------------

const candidateForm = document.getElementById("candidateForm");
const formSuccess = document.getElementById("formSuccess");
const formError = document.getElementById("formError");
const submitBtn = document.getElementById("submitBtn");
const btnText = submitBtn.querySelector(".btn-text");
const spinner = document.getElementById("submitSpinner");
const candidateFormModalEl = document.getElementById("candidateFormModal");

document.getElementById("openCreateBtn").addEventListener("click", () => {
  resetForm();
  document.getElementById("candidateFormModalTitle").textContent = "Add Candidate";
  btnText.textContent = "Add Candidate";
  showStep1();
  new bootstrap.Modal(candidateFormModalEl).show();
});

function resetForm() {
  candidateForm.reset();
  candidateForm.classList.remove("was-validated");
  formSuccess.classList.add("d-none");
  formError.classList.add("d-none");
  document.getElementById("preScreenResult").innerHTML = "";
  document.getElementById("candidateId").value = "";
  document.getElementById("existingCvNote").classList.add("d-none");
  document.getElementById("jobOpeningId").classList.remove("is-invalid");
}

function openEditForm(id) {
  const c = allCandidates.find((x) => x.id === id);
  if (!c) return;

  resetForm();
  document.getElementById("candidateFormModalTitle").textContent = "Edit Candidate";
  btnText.textContent = "Save Changes";

  document.getElementById("candidateId").value = c.id;
  document.getElementById("fullName").value = c.fullName;
  document.getElementById("jobOpeningId").value = c.jobOpeningId;

  const note = document.getElementById("existingCvNote");
  if (c.hasCv) {
    note.textContent = `Current CV: ${c.cvFileName} (${formatFileSize(c.cvFileSize)}). Upload a new file to replace it.`;
    note.classList.remove("d-none");
  }

  showStep2();
  document.getElementById("step2ContextNote").innerHTML = `<strong>Position:</strong> ${escapeHtml(c.jobOpeningTitle)}`;

  new bootstrap.Modal(candidateFormModalEl).show();
}

function setSubmitting(isSubmitting) {
  submitBtn.disabled = isSubmitting;
  spinner.classList.toggle("d-none", !isSubmitting);
}

candidateForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  formSuccess.classList.add("d-none");
  formError.classList.add("d-none");
  candidateForm.classList.remove("was-validated");

  if (!candidateForm.checkValidity()) {
    candidateForm.classList.add("was-validated");
    return;
  }

  const id = document.getElementById("candidateId").value;
  const cvInput = document.getElementById("cvFile");
  const isEdit = !!id;

  if (!isEdit && cvInput.files.length === 0) {
    formError.textContent = "A CV file is required.";
    formError.classList.remove("d-none");
    return;
  }

  const formData = new FormData();
  formData.append("fullName", document.getElementById("fullName").value.trim());
  formData.append("jobOpeningId", document.getElementById("jobOpeningId").value);

  if (cvInput.files.length > 0) formData.append("cvFile", cvInput.files[0]);

  const url = isEdit ? `${CANDIDATES_API}/${id}` : CANDIDATES_API;
  const method = isEdit ? "PUT" : "POST";

  setSubmitting(true);

  try {
    const response = await fetch(url, {
      method,
      headers: { ...getAuthHeader() },
      body: formData,
    });

    if (response.status === 401 || response.status === 403) {
      formError.textContent = "You are not authorized to perform this action.";
      formError.classList.remove("d-none");
      return;
    }

    if (!response.ok) {
      let errors = {};
      try { errors = await response.json(); } catch (err) { errors = {}; }
      const messages = Object.values(errors).join(" ");
      formError.textContent = messages || "Please check the form and try again.";
      formError.classList.remove("d-none");
      return;
    }

    formSuccess.textContent = isEdit ? "Candidate profile updated successfully." : "Candidate profile created successfully.";
    formSuccess.classList.remove("d-none");

    await loadCandidates();

    setTimeout(() => {
      const modalInstance = bootstrap.Modal.getInstance(candidateFormModalEl);
      if (modalInstance) modalInstance.hide();
    }, 900);
  } catch (err) {
    formError.textContent = "Unable to reach the server. Please try again later.";
    formError.classList.remove("d-none");
  } finally {
    setSubmitting(false);
  }
});

// ---------------------------------------------------------------------
// Delete
// ---------------------------------------------------------------------

async function deleteCandidate(id) {
  const c = allCandidates.find((x) => x.id === id);
  if (!c) return;
  if (!confirm(`Delete "${c.fullName}"? This cannot be undone.`)) return;

  try {
    const response = await fetch(`${CANDIDATES_API}/${id}`, {
      method: "DELETE",
      headers: { ...getAuthHeader() },
    });
    if (!response.ok && response.status !== 204) throw new Error("Delete failed");
    await loadCandidates();
  } catch (err) {
    alert("Could not delete this candidate. Please try again.");
  }
}

// ---------------------------------------------------------------------
// View / Screening modal
// ---------------------------------------------------------------------

function openView(id) {
  const c = allCandidates.find((x) => x.id === id);
  if (!c) return;

  const job = allJobs.find((x) => x.id === c.jobOpeningId);

  document.getElementById("viewTitle").textContent = c.fullName;

  const stageClass = "stage-" + c.stage.toLowerCase();
  const cvSection = c.hasCv
    ? `<button type="button" class="cv-link btn btn-link p-0" data-action="view-cv" data-id="${c.id}"><i class="bi bi-file-earmark-text"></i> ${escapeHtml(c.cvFileName)} (${formatFileSize(c.cvFileSize)})</button>`
    : `<span class="no-cv">No CV uploaded</span>`;

  document.getElementById("viewBody").innerHTML = `
    <div class="details-section">
      <div class="details-meta-row"><span>Email</span><span>${escapeHtml(c.email) || "—"}</span></div>
      <div class="details-meta-row"><span>Phone</span><span>${escapeHtml(c.phone) || "—"}</span></div>
      <div class="details-meta-row"><span>Applied Position</span><span>${escapeHtml(c.jobOpeningTitle)}</span></div>
      <div class="details-meta-row"><span>Applied Date</span><span>${formatDate(c.createdAt)}</span></div>
      <div class="details-meta-row"><span>Current Stage</span><span><span class="stage-pill ${stageClass}">${stageLabel(c.stage)}</span></span></div>
      <div class="details-meta-row"><span>CV / Resume</span><span>${cvSection}</span></div>
    </div>

    <h6 class="section-heading">CV Screening</h6>

    <div id="autoScreeningResult" class="mb-3">
      <div class="text-muted small">Loading automated match score...</div>
    </div>

    <div class="screening-panel mb-3">
      <div class="screening-col">
        <h6>Candidate Profile</h6>
        <div class="field-label">Skills</div>
        <div class="field-value">${escapeHtml(c.skills) || "—"}</div>
        <div class="field-label">Experience</div>
        <div class="field-value">${escapeHtml(c.experience) || "—"}</div>
        <div class="field-label">Qualifications</div>
        <div class="field-value">${escapeHtml(c.qualifications) || "—"}</div>
      </div>
      <div class="screening-col">
        <h6>Job Requirements${job ? "" : " (job opening not found)"}</h6>
        <div class="field-label">Required Skills</div>
        <div class="field-value">${job ? escapeHtml(job.skills) : "—"}</div>
        <div class="field-label">Experience Required</div>
        <div class="field-value">${job ? escapeHtml(job.experienceRequired) : "—"}</div>
        <div class="field-label">Required Qualifications</div>
        <div class="field-value">${job ? escapeHtml(job.qualifications) : "—"}</div>
      </div>
    </div>

    <div class="d-flex justify-content-between align-items-center flex-wrap gap-2">
      <div class="btn-group">
        <button class="btn btn-outline-success btn-sm" id="shortlistBtn"><i class="bi bi-check-circle"></i> Shortlist</button>
        <button class="btn btn-outline-danger btn-sm" id="notShortlistBtn"><i class="bi bi-x-circle"></i> Not Shortlisted</button>
      </div>
      <select class="form-select form-select-sm w-auto" id="stageSelect">
        ${["APPLIED", "SCREENING", "SHORTLISTED", "NOT_SHORTLISTED"]
          .map((s) => `<option value="${s}" ${s === c.stage ? "selected" : ""}>${stageLabel(s)}</option>`)
          .join("")}
      </select>
      <div class="text-muted small mt-2" style="width:100%;">Once shortlisted, interview-stage progress is driven by scheduling an interview and the Hiring Manager's decisions — not this dropdown.</div>
    </div>

    <div id="screeningConfirm" class="alert alert-success mt-3 d-none py-2 small"></div>
  `;

  document.getElementById("shortlistBtn").addEventListener("click", () => applyStage(c.id, "SHORTLISTED"));
  document.getElementById("notShortlistBtn").addEventListener("click", () => applyStage(c.id, "NOT_SHORTLISTED"));
  document.getElementById("stageSelect").addEventListener("change", (e) => applyStage(c.id, e.target.value));

  const cvBtn = document.querySelector('#viewBody [data-action="view-cv"]');
  if (cvBtn) cvBtn.addEventListener("click", () => openCv(c.id));

  loadAutoScreeningResult(c.id);

  new bootstrap.Modal(document.getElementById("candidateViewModal")).show();
}

// ---------------------------------------------------------------------
// Automated CV Screening (on the View modal — informational only)
// ---------------------------------------------------------------------

async function loadAutoScreeningResult(candidateId) {
  const container = document.getElementById("autoScreeningResult");
  if (!container) return;

  try {
    const response = await fetch(`${CANDIDATES_API}/${candidateId}/screening`, { headers: { ...getAuthHeader() } });
    if (!response.ok) throw new Error("Failed to load screening result");

    const result = await response.json();
    const skillMatches = Array.isArray(result.skillMatches) ? result.skillMatches : [];

    const skillsHtml = skillMatches.map((s) => `
      <span class="badge ${s.matched ? "bg-success" : "bg-secondary"} me-1 mb-1">
        <i class="bi ${s.matched ? "bi-check" : "bi-x"}"></i> ${escapeHtml(s.skill)}
      </span>
    `).join("");

    const recommendationBadge = result.recommendation === "SHORTLIST"
      ? `<span class="badge bg-success">Recommended: Shortlist</span>`
      : `<span class="badge bg-danger">Recommended: Reject</span>`;

    const sourceNote = result.sourceUsed === "CV"
      ? "Based on the candidate's uploaded CV."
      : `Based on the candidate's entered profile fields (not the CV) — ${escapeHtml(result.extractionMessage || "")}`;

    container.innerHTML = `
      <div class="card border-0" style="background:#f8f9fb;">
        <div class="card-body p-3">
          <div class="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-2">
            <div>
              <span style="font-weight:700; font-size:1.1rem;">${result.matchScorePercent}%</span>
              <span class="text-muted small"> match (cutoff: ${result.cutoffScore}%)</span>
            </div>
            ${recommendationBadge}
          </div>
          <div class="mb-2">
            ${skillsHtml || `<span class="text-muted small">No required skills listed on this job opening.</span>`}
          </div>
          <div class="text-muted" style="font-size:0.75rem;">
            ${sourceNote} This is a suggestion only — use the Shortlist / Not Shortlisted buttons below to make the actual decision.
          </div>
        </div>
      </div>
    `;
  } catch (err) {
    container.innerHTML = `<div class="text-muted small">Could not load the automated screening result.</div>`;
  }
}

// ---------------------------------------------------------------------
// Stage change
// ---------------------------------------------------------------------

async function applyStage(id, stage) {
  try {
    const response = await fetch(`${CANDIDATES_API}/${id}/stage`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...getAuthHeader() },
      body: JSON.stringify({ stage }),
    });
    if (!response.ok) throw new Error("Stage update failed");

    const confirmBox = document.getElementById("screeningConfirm");
    if (confirmBox) {
      confirmBox.textContent = `Marked as ${stageLabel(stage)}.`;
      confirmBox.classList.remove("d-none");
    }
    await loadCandidates();
  } catch (err) {
    alert("Could not update the candidate's stage. Please try again.");
  }
}

// ---------------------------------------------------------------------
// Start page
// ---------------------------------------------------------------------

if (guardHrAccess()) {
  loadJobsForDropdowns().then(loadCandidates);
}
