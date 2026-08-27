const API_BASE_URL = "http://localhost:8080/api/hr/jobs";
const HIRING_MANAGERS_API = "http://localhost:8080/api/hr/users/hiring-managers";

const guardMessage = document.getElementById("guardMessage");
const pageContent = document.getElementById("pageContent");
const logoutBtn = document.getElementById("logoutBtn");

let allJobs = []; // cached full list for client-side search/filter

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
  document.getElementById("sidebarAvatar").textContent = initial;
  document.getElementById("sidebarUsername").textContent = username;

  pageContent.classList.remove("d-none");
  return true;
}

logoutBtn.addEventListener("click", () => {
  sessionStorage.clear();
  window.location.href = "login.html";
});

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str || "";
  return div.innerHTML;
}

function statusLabel(status) {
  return { OPEN: "Open", ON_HOLD: "On Hold", CLOSED: "Closed" }[status] || status;
}

function formatDate(value) {
  if (!value) return "";
  const d = new Date(value);
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

// Deterministic sample candidate count per job, for layout only — no
// real Candidate feature exists yet, so this is never treated as real data.
function sampleCandidateCount(jobId) {
  return (jobId * 7) % 30 + 3;
}

// ---------------------------------------------------------------------
// Loading & rendering the table
// ---------------------------------------------------------------------

async function loadHiringManagers() {
  try {
    const response = await fetch(HIRING_MANAGERS_API, { headers: { ...getAuthHeader() } });
    if (!response.ok) throw new Error("Failed to load hiring managers");
    const usernames = await response.json();
    const select = document.getElementById("jobAssignedTo");
    select.innerHTML = '<option value="">Unassigned</option>' +
      usernames.map((u) => `<option value="${escapeHtml(u)}">${escapeHtml(u)}</option>`).join("");
  } catch (err) {
    // Non-fatal — dropdown just stays "Unassigned" only
  }
}

async function loadJobs() {
  const loading = document.getElementById("jobsLoading");
  const empty = document.getElementById("jobsEmpty");
  const table = document.getElementById("jobsTable");

  loading.classList.remove("d-none");
  empty.classList.add("d-none");
  table.classList.add("d-none");

  try {
    const response = await fetch(API_BASE_URL, { headers: { ...getAuthHeader() } });
    if (!response.ok) throw new Error("Failed to load job openings");
    allJobs = await response.json();
    populateDepartmentFilter();
    applyFilters();
  } catch (err) {
    empty.textContent = "Could not load job openings. Please refresh the page.";
    empty.classList.remove("d-none");
  } finally {
    loading.classList.add("d-none");
  }
}

function populateDepartmentFilter() {
  const select = document.getElementById("departmentFilter");
  const current = select.value;
  const departments = [...new Set(allJobs.map((j) => j.department).filter(Boolean))].sort();
  select.innerHTML = '<option value="">All departments</option>' +
    departments.map((d) => `<option value="${escapeHtml(d)}">${escapeHtml(d)}</option>`).join("");
  select.value = current;
}

function applyFilters() {
  const search = document.getElementById("searchInput").value.trim().toLowerCase();
  const status = document.getElementById("statusFilter").value;
  const department = document.getElementById("departmentFilter").value;

  const filtered = allJobs.filter((job) => {
    const matchesSearch = !search || job.title.toLowerCase().includes(search);
    const matchesStatus = !status || job.status === status;
    const matchesDept = !department || job.department === department;
    return matchesSearch && matchesStatus && matchesDept;
  });

  renderTable(filtered);
}

function renderTable(jobs) {
  const tbody = document.getElementById("jobsTableBody");
  const table = document.getElementById("jobsTable");
  const empty = document.getElementById("jobsEmpty");

  tbody.innerHTML = "";

  if (!jobs || jobs.length === 0) {
    table.classList.add("d-none");
    empty.classList.remove("d-none");
    return;
  }
  empty.classList.add("d-none");
  table.classList.remove("d-none");

  jobs.forEach((job) => {
    const tr = document.createElement("tr");
    const statusClass = "status-" + job.status.toLowerCase();
    tr.innerHTML = `
      <td class="job-title-cell">${escapeHtml(job.title)}</td>
      <td>${escapeHtml(job.department)}</td>
      <td>${formatDate(job.createdAt)}</td>
      <td class="candidate-count">${sampleCandidateCount(job.id)} <span class="sample-badge">Sample</span></td>
      <td><span class="status-pill ${statusClass}">${statusLabel(job.status)}</span></td>
      <td class="text-end">
        <button class="action-btn" title="View" data-action="view" data-id="${job.id}"><i class="bi bi-eye"></i></button>
        <button class="action-btn" title="Edit" data-action="edit" data-id="${job.id}"><i class="bi bi-pencil"></i></button>
        <button class="action-btn text-danger" title="Delete" data-action="delete" data-id="${job.id}"><i class="bi bi-trash"></i></button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

document.getElementById("searchInput").addEventListener("input", applyFilters);
document.getElementById("statusFilter").addEventListener("change", applyFilters);
document.getElementById("departmentFilter").addEventListener("change", applyFilters);
document.getElementById("clearFiltersBtn").addEventListener("click", () => {
  document.getElementById("searchInput").value = "";
  document.getElementById("statusFilter").value = "";
  document.getElementById("departmentFilter").value = "";
  applyFilters();
});

document.getElementById("jobsTableBody").addEventListener("click", (e) => {
  const btn = e.target.closest(".action-btn");
  if (!btn) return;
  const id = Number(btn.dataset.id);
  const action = btn.dataset.action;
  if (action === "view") openDetails(id);
  if (action === "edit") openEditForm(id);
  if (action === "delete") deleteJob(id);
});

// ---------------------------------------------------------------------
// Create / Edit form (shared modal)
// ---------------------------------------------------------------------

const jobForm = document.getElementById("jobForm");
const formSuccess = document.getElementById("formSuccess");
const formError = document.getElementById("formError");
const submitBtn = document.getElementById("submitBtn");
const btnText = submitBtn.querySelector(".btn-text");
const spinner = document.getElementById("submitSpinner");
const jobFormModalEl = document.getElementById("jobFormModal");

document.getElementById("openCreateBtn").addEventListener("click", () => {
  resetForm();
  document.getElementById("jobFormModalTitle").textContent = "Create Job Opening";
  btnText.textContent = "Create Job Opening";
});

function resetForm() {
  jobForm.reset();
  jobForm.classList.remove("was-validated");
  formSuccess.classList.add("d-none");
  formError.classList.add("d-none");
  document.getElementById("jobId").value = "";
  document.querySelectorAll(".stage-check").forEach((cb) => { cb.checked = false; });
  document.getElementById("stageCv").checked = true;
  document.getElementById("stageTech").checked = true;
  document.getElementById("stageHr").checked = true;
}

function openEditForm(id) {
  const job = allJobs.find((j) => j.id === id);
  if (!job) return;

  resetForm();
  document.getElementById("jobFormModalTitle").textContent = "Edit Job Opening";
  btnText.textContent = "Save Changes";

  document.getElementById("jobId").value = job.id;
  document.getElementById("jobTitle").value = job.title;
  document.getElementById("jobDepartment").value = job.department;
  document.getElementById("jobLocation").value = job.location;
  document.getElementById("jobEmploymentType").value = job.employmentType;
  document.getElementById("jobVacancies").value = job.vacancies;
  document.getElementById("jobDescription").value = job.description;
  document.getElementById("jobQualifications").value = job.qualifications || "";
  document.getElementById("jobSkills").value = job.skills || "";
  document.getElementById("jobExperience").value = job.experienceRequired || "";
  document.getElementById("jobDeadline").value = job.applicationDeadline || "";
  document.getElementById("jobStatus").value = job.status;
  document.getElementById("jobAssignedTo").value = job.assignedTo || "";

  const selectedStages = (job.interviewStages || "").split(",").map((s) => s.trim());
  document.querySelectorAll(".stage-check").forEach((cb) => {
    cb.checked = selectedStages.includes(cb.value);
  });

  new bootstrap.Modal(jobFormModalEl).show();
}

function setSubmitting(isSubmitting) {
  submitBtn.disabled = isSubmitting;
  spinner.classList.toggle("d-none", !isSubmitting);
}

jobForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  formSuccess.classList.add("d-none");
  formError.classList.add("d-none");
  jobForm.classList.remove("was-validated");

  if (!jobForm.checkValidity()) {
    jobForm.classList.add("was-validated");
    return;
  }

  const id = document.getElementById("jobId").value;
  const stages = Array.from(document.querySelectorAll(".stage-check:checked")).map((cb) => cb.value).join(",");

  const payload = {
    title: document.getElementById("jobTitle").value.trim(),
    department: document.getElementById("jobDepartment").value.trim(),
    location: document.getElementById("jobLocation").value.trim(),
    employmentType: document.getElementById("jobEmploymentType").value,
    vacancies: Number(document.getElementById("jobVacancies").value),
    description: document.getElementById("jobDescription").value.trim(),
    qualifications: document.getElementById("jobQualifications").value.trim(),
    skills: document.getElementById("jobSkills").value.trim(),
    experienceRequired: document.getElementById("jobExperience").value.trim(),
    applicationDeadline: document.getElementById("jobDeadline").value || null,
    status: document.getElementById("jobStatus").value,
    interviewStages: stages,
    assignedTo: document.getElementById("jobAssignedTo").value || null,
  };

  const isEdit = !!id;
  const url = isEdit ? `${API_BASE_URL}/${id}` : API_BASE_URL;
  const method = isEdit ? "PUT" : "POST";

  setSubmitting(true);
  try {
    const response = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json", ...getAuthHeader() },
      body: JSON.stringify(payload),
    });

    if (response.status === 401 || response.status === 403) {
      formError.textContent = "You are not authorized to perform this action.";
      formError.classList.remove("d-none");
      return;
    }

    if (!response.ok) {
      const errors = await response.json();
      const messages = Object.values(errors).join(" ");
      formError.textContent = messages || "Please check the form and try again.";
      formError.classList.remove("d-none");
      return;
    }

    formSuccess.textContent = isEdit ? "Job opening updated successfully." : "Job opening created successfully.";
    formSuccess.classList.remove("d-none");
    await loadJobs();

    setTimeout(() => {
      const modalInstance = bootstrap.Modal.getInstance(jobFormModalEl);
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

async function deleteJob(id) {
  const job = allJobs.find((j) => j.id === id);
  if (!job) return;
  if (!confirm(`Delete "${job.title}"? This cannot be undone.`)) return;

  try {
    const response = await fetch(`${API_BASE_URL}/${id}`, {
      method: "DELETE",
      headers: { ...getAuthHeader() },
    });
    if (!response.ok && response.status !== 204) throw new Error("Delete failed");
    await loadJobs();
  } catch (err) {
    alert("Could not delete this job opening. Please try again.");
  }
}

// ---------------------------------------------------------------------
// Details modal
// ---------------------------------------------------------------------

function openDetails(id) {
  const job = allJobs.find((j) => j.id === id);
  if (!job) return;

  document.getElementById("detailsTitle").textContent = job.title;

  const statusClass = "status-" + job.status.toLowerCase();
  const stages = (job.interviewStages || "").split(",").map((s) => s.trim()).filter(Boolean);
  const skills = (job.skills || "").split(",").map((s) => s.trim()).filter(Boolean);

  // Sample pipeline counts derived from the same deterministic sample
  // candidate count, split across stages — for layout only.
  const total = sampleCandidateCount(job.id);
  const screening = Math.max(0, Math.round(total * 0.5));
  const interview = Math.max(0, Math.round(total * 0.25));
  const hired = job.status === "CLOSED" ? Math.max(1, Math.round(total * 0.08)) : 0;

  document.getElementById("detailsBody").innerHTML = `
    <div class="details-section">
      <div class="details-meta-row"><span>Department</span><span>${escapeHtml(job.department)}</span></div>
      <div class="details-meta-row"><span>Location</span><span>${escapeHtml(job.location)}</span></div>
      <div class="details-meta-row"><span>Employment</span><span>${escapeHtml(job.employmentType)}</span></div>
      <div class="details-meta-row"><span>Vacancies</span><span>${escapeHtml(String(job.vacancies))}</span></div>
      <div class="details-meta-row"><span>Posted</span><span>${formatDate(job.createdAt)}</span></div>
      ${job.applicationDeadline ? `<div class="details-meta-row"><span>Deadline</span><span>${formatDate(job.applicationDeadline)}</span></div>` : ""}
      <div class="details-meta-row"><span>Status</span><span><span class="status-pill ${statusClass}">${statusLabel(job.status)}</span></span></div>
    </div>

    <div class="details-section">
      <h6>Job Description</h6>
      <p class="mb-0" style="white-space: pre-wrap;">${escapeHtml(job.description)}</p>
    </div>

    ${job.qualifications ? `
    <div class="details-section">
      <h6>Required Qualifications</h6>
      <p class="mb-0" style="white-space: pre-wrap;">${escapeHtml(job.qualifications)}</p>
    </div>` : ""}

    ${skills.length ? `
    <div class="details-section">
      <h6>Required Skills</h6>
      <p class="mb-0">${skills.map((s) => `<span class="sample-badge" style="background:#eef1f4;color:#16324f;">${escapeHtml(s)}</span>`).join(" ")}</p>
    </div>` : ""}

    ${job.experienceRequired ? `
    <div class="details-section">
      <h6>Experience Required</h6>
      <p class="mb-0">${escapeHtml(job.experienceRequired)}</p>
    </div>` : ""}

    ${stages.length ? `
    <div class="details-section">
      <h6>Interview Stages</h6>
      <p class="mb-0">${stages.map((s) => `<span class="badge text-bg-light border me-1">${escapeHtml(s)}</span>`).join("")}</p>
    </div>` : ""}

    <div class="details-section">
      <h6>Recruitment Pipeline <span class="sample-badge">Sample</span></h6>
      <div class="pipeline-mini">
        <div><div class="num">${total}</div><div class="label">Applied</div></div>
        <div><div class="num">${screening}</div><div class="label">Screening</div></div>
        <div><div class="num">${interview}</div><div class="label">Interview</div></div>
        <div><div class="num">${hired}</div><div class="label">Hired</div></div>
      </div>
    </div>

    <div class="d-flex justify-content-between align-items-center flex-wrap gap-2 mt-4">
      <button class="btn btn-outline-secondary btn-sm" disabled title="Candidate tracking coming soon">
        <i class="bi bi-people"></i> View Candidates
      </button>
      <div class="d-flex gap-2">
        <button class="btn btn-outline-secondary btn-sm" id="detailsEditBtn"><i class="bi bi-pencil"></i> Edit Job</button>
        ${job.status !== "CLOSED" ? `<button class="btn btn-outline-danger btn-sm" id="detailsCloseBtn"><i class="bi bi-x-circle"></i> Close Job</button>` : ""}
      </div>
    </div>
  `;

  document.getElementById("detailsEditBtn").addEventListener("click", () => {
    bootstrap.Modal.getInstance(document.getElementById("jobDetailsModal")).hide();
    openEditForm(job.id);
  });

  const closeBtn = document.getElementById("detailsCloseBtn");
  if (closeBtn) {
    closeBtn.addEventListener("click", async () => {
      await changeStatus(job.id, "CLOSED");
      bootstrap.Modal.getInstance(document.getElementById("jobDetailsModal")).hide();
    });
  }

  new bootstrap.Modal(document.getElementById("jobDetailsModal")).show();
}

async function changeStatus(id, status) {
  try {
    const response = await fetch(`${API_BASE_URL}/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...getAuthHeader() },
      body: JSON.stringify({ status }),
    });
    if (!response.ok) throw new Error("Status update failed");
    await loadJobs();
  } catch (err) {
    alert("Could not update the job status. Please try again.");
  }
}

if (guardHrAccess()) {
  loadJobs();
  loadHiringManagers();
}
