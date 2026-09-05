let allInterviews = [];

async function loadInterviews() {
  const loading = document.getElementById("interviewsLoading");
  const empty = document.getElementById("interviewsEmpty");
  const table = document.getElementById("interviewsTable");

  loading.classList.remove("d-none");
  try {
    const response = await fetch(`${HM_API}/interviews`, { headers: { ...getAuthHeader() } });
    if (!response.ok) throw new Error("Failed to load interviews");
    allInterviews = await response.json();
    populateStageFilter();
    applyFilters();
  } catch (err) {
    empty.textContent = "Could not load the interview schedule. Please refresh the page.";
    empty.classList.remove("d-none");
  } finally {
    loading.classList.add("d-none");
  }
}

function populateStageFilter() {
  const select = document.getElementById("stageFilter");
  const stages = [...new Set(allInterviews.map((i) => i.stage))].sort();
  select.innerHTML = '<option value="">All stages</option>' +
    stages.map((s) => `<option value="${escapeHtml(s)}">${escapeHtml(s)}</option>`).join("");
}

function applyFilters() {
  const search = document.getElementById("searchInput").value.trim().toLowerCase();
  const stage = document.getElementById("stageFilter").value;
  const status = document.getElementById("statusFilter").value;

  const filtered = allInterviews.filter((i) => {
    const matchesSearch = !search || i.candidateName.toLowerCase().includes(search);
    const matchesStage = !stage || i.stage === stage;
    const matchesStatus = !status || i.status === status;
    return matchesSearch && matchesStage && matchesStatus;
  });
  renderTable(filtered);
}

document.getElementById("searchInput").addEventListener("input", applyFilters);
document.getElementById("stageFilter").addEventListener("change", applyFilters);
document.getElementById("statusFilter").addEventListener("change", applyFilters);
document.getElementById("clearFiltersBtn").addEventListener("click", () => {
  document.getElementById("searchInput").value = "";
  document.getElementById("stageFilter").value = "";
  document.getElementById("statusFilter").value = "";
  applyFilters();
});

function statusBadgeClass(status) {
  return "status-" + status.toLowerCase();
}

function statusLabel(status) {
  return { SCHEDULED: "Scheduled", COMPLETED: "Completed", CANCELLED: "Cancelled" }[status] || status;
}

function renderTable(interviews) {
  const empty = document.getElementById("interviewsEmpty");
  const table = document.getElementById("interviewsTable");
  const tbody = document.getElementById("interviewsTableBody");

  if (!interviews || interviews.length === 0) {
    empty.classList.remove("d-none");
    table.classList.add("d-none");
    return;
  }
  empty.classList.add("d-none");
  table.classList.remove("d-none");

  tbody.innerHTML = interviews.map((i) => `
    <tr>
      <td class="job-title-cell">${escapeHtml(i.candidateName)}</td>
      <td>${escapeHtml(i.jobOpeningTitle)}</td>
      <td>${formatDate(i.interviewDate)}, ${formatTime(i.interviewTime)}</td>
      <td>${escapeHtml(i.interviewer)}</td>
      <td>${escapeHtml(i.stage)}</td>
      <td><span class="status-badge ${statusBadgeClass(i.status)}">${statusLabel(i.status)}</span></td>
      <td class="text-end"><button class="btn btn-sm btn-outline-secondary" data-id="${i.id}">View</button></td>
    </tr>
  `).join("");

  tbody.querySelectorAll("button[data-id]").forEach((btn) => {
    btn.addEventListener("click", () => openDetails(Number(btn.dataset.id)));
  });
}

async function openDetails(id) {
  const i = allInterviews.find((x) => x.id === id);
  if (!i) return;

  document.getElementById("detailsTitle").textContent = `${i.candidateName} — ${i.stage}`;

  let feedback = null;
  if (i.hasFeedback) {
    try {
      const response = await fetch(`${HM_API}/interviews/${id}/feedback`, { headers: { ...getAuthHeader() } });
      if (response.ok) feedback = await response.json();
    } catch (err) {
      // fall through to no-feedback state
    }
  }

  const feedbackHtml = feedback ? `
    <div class="feedback-readout"><span>Technical Skills</span><span class="score-pill">${feedback.technicalSkills}</span></div>
    <div class="feedback-readout"><span>Communication</span><span class="score-pill">${feedback.communication}</span></div>
    <div class="feedback-readout"><span>Problem Solving</span><span class="score-pill">${feedback.problemSolving}</span></div>
    <div class="feedback-readout"><span>Cultural Fit</span><span class="score-pill">${feedback.culturalFit}</span></div>
    <div class="feedback-readout"><span>Overall Recommendation</span><span class="score-pill">${feedback.overallRecommendation}</span></div>
    <div class="mt-2">
      <div class="small text-muted">Comments</div>
      <div style="white-space: pre-wrap; font-size: 0.88rem;">${escapeHtml(feedback.comments)}</div>
    </div>
    <div class="small text-muted mt-2">Submitted by ${escapeHtml(feedback.submittedBy)} on ${formatDateTime(feedback.submittedAt)}</div>
  ` : `<div class="text-muted small">No feedback submitted yet for this interview.</div>`;

  document.getElementById("detailsBody").innerHTML = `
    <div class="details-section">
      <div class="details-meta-row"><span>Candidate</span><span>${escapeHtml(i.candidateName)}</span></div>
      <div class="details-meta-row"><span>Position</span><span>${escapeHtml(i.jobOpeningTitle)}</span></div>
      <div class="details-meta-row"><span>Date &amp; Time</span><span>${formatDate(i.interviewDate)}, ${formatTime(i.interviewTime)}</span></div>
      <div class="details-meta-row"><span>Interviewer</span><span>${escapeHtml(i.interviewer)}</span></div>
      <div class="details-meta-row"><span>Stage</span><span>${escapeHtml(i.stage)}</span></div>
      <div class="details-meta-row"><span>Status</span><span><span class="status-badge ${statusBadgeClass(i.status)}">${statusLabel(i.status)}</span></span></div>
    </div>
    <h6 class="section-heading">Interview Feedback</h6>
    ${feedbackHtml}
    <div class="text-end mt-3">
      <a href="hm-feedback.html" class="btn btn-login btn-sm px-3">Go to Feedback &amp; Decisions</a>
    </div>
  `;

  new bootstrap.Modal(document.getElementById("interviewDetailsModal")).show();
}

if (guardHmAccess()) {
  loadInterviews();
}
