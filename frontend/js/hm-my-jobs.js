let myJobs = [];

async function loadMyJobs() {
  const loading = document.getElementById("jobsLoading");
  const empty = document.getElementById("jobsEmpty");
  const table = document.getElementById("jobsTable");

  loading.classList.remove("d-none");
  try {
    const response = await fetch(`${HM_API}/jobs`, { headers: { ...getAuthHeader() } });
    if (!response.ok) throw new Error("Failed to load jobs");
    myJobs = await response.json();
    renderTable(myJobs);
  } catch (err) {
    empty.textContent = "Could not load your job openings. Please refresh the page.";
    empty.classList.remove("d-none");
  } finally {
    loading.classList.add("d-none");
  }
}

function renderTable(jobs) {
  const empty = document.getElementById("jobsEmpty");
  const table = document.getElementById("jobsTable");
  const tbody = document.getElementById("jobsTableBody");

  if (!jobs || jobs.length === 0) {
    empty.classList.remove("d-none");
    table.classList.add("d-none");
    return;
  }
  empty.classList.add("d-none");
  table.classList.remove("d-none");

  tbody.innerHTML = jobs.map((j) => {
    const statusClass = "status-" + j.status.toLowerCase();
    const statusLabel = { OPEN: "Open", ON_HOLD: "On Hold", CLOSED: "Closed" }[j.status] || j.status;
    return `
      <tr>
        <td class="job-title-cell">${escapeHtml(j.title)}</td>
        <td>${escapeHtml(j.department)}</td>
        <td>${escapeHtml(j.location)}</td>
        <td>${j.vacancies}</td>
        <td><span class="status-pill ${statusClass}">${statusLabel}</span></td>
        <td class="text-end"><button class="btn btn-sm btn-outline-secondary" data-id="${j.id}">View</button></td>
      </tr>
    `;
  }).join("");

  tbody.querySelectorAll("button[data-id]").forEach((btn) => {
    btn.addEventListener("click", () => openDetails(Number(btn.dataset.id)));
  });
}

function openDetails(id) {
  const job = myJobs.find((j) => j.id === id);
  if (!job) return;

  document.getElementById("detailsTitle").textContent = job.title;
  const skills = (job.skills || "").split(",").map((s) => s.trim()).filter(Boolean);

  document.getElementById("detailsBody").innerHTML = `
    <div class="details-section">
      <div class="details-meta-row"><span>Department</span><span>${escapeHtml(job.department)}</span></div>
      <div class="details-meta-row"><span>Location</span><span>${escapeHtml(job.location)}</span></div>
      <div class="details-meta-row"><span>Employment</span><span>${escapeHtml(job.employmentType)}</span></div>
      <div class="details-meta-row"><span>Vacancies</span><span>${job.vacancies}</span></div>
      <div class="details-meta-row"><span>Posted</span><span>${formatDateTime(job.createdAt)}</span></div>
    </div>
    <div class="details-section">
      <h6>Job Description</h6>
      <p class="mb-0" style="white-space: pre-wrap;">${escapeHtml(job.description)}</p>
    </div>
    ${job.qualifications ? `<div class="details-section"><h6>Required Qualifications</h6><p class="mb-0" style="white-space:pre-wrap;">${escapeHtml(job.qualifications)}</p></div>` : ""}
    ${skills.length ? `<div class="details-section"><h6>Required Skills</h6><p class="mb-0">${skills.map((s) => `<span class="badge text-bg-light border me-1">${escapeHtml(s)}</span>`).join("")}</p></div>` : ""}
    ${job.experienceRequired ? `<div class="details-section"><h6>Experience Required</h6><p class="mb-0">${escapeHtml(job.experienceRequired)}</p></div>` : ""}
    <div class="text-end mt-3">
      <a href="hm-candidates.html" class="btn btn-login btn-sm px-3">View Candidates for this Job</a>
    </div>
  `;

  new bootstrap.Modal(document.getElementById("jobDetailsModal")).show();
}

if (guardHmAccess()) {
  loadMyJobs();
}
