let allInterviews = [];

async function loadInterviews() {
  const loading = document.getElementById("interviewsLoading");
  const empty = document.getElementById("interviewsEmpty");
  const table = document.getElementById("interviewsTable");

  loading.classList.remove("d-none");
  try {
    const response = await fetch(`${INT_API}/interviews`, { headers: { ...getAuthHeader() } });
    if (!response.ok) throw new Error("Failed to load interviews");
    allInterviews = await response.json();
    populateStageFilter();
    applyFilters();
  } catch (err) {
    empty.textContent = "Could not load your interviews. Please refresh the page.";
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
      const response = await fetch(`${INT_API}/interviews/${id}/feedback`, { headers: { ...getAuthHeader() } });
      if (response.ok) feedback = await response.json();
    } catch (err) {
      // fall through to no-feedback state
    }
  }

  document.getElementById("detailsBody").innerHTML = `
    <div class="details-section">
      <div class="details-meta-row"><span>Candidate</span><span>${escapeHtml(i.candidateName)}</span></div>
      <div class="details-meta-row"><span>Position</span><span>${escapeHtml(i.jobOpeningTitle)}</span></div>
      <div class="details-meta-row"><span>Date &amp; Time</span><span>${formatDate(i.interviewDate)}, ${formatTime(i.interviewTime)}</span></div>
      <div class="details-meta-row"><span>Stage</span><span>${escapeHtml(i.stage)}</span></div>
      <div class="details-meta-row"><span>Status</span><span><span class="status-badge ${statusBadgeClass(i.status)}">${statusLabel(i.status)}</span></span></div>
    </div>
    <h6 class="section-heading">Interview Feedback</h6>
    <div id="feedbackArea-${i.id}">${feedback ? renderFeedbackReadout(feedback, i.id) : renderFeedbackPlaceholder(i.id)}</div>
  `;

  new bootstrap.Modal(document.getElementById("interviewDetailsModal")).show();
}

function renderFeedbackReadout(feedback, interviewId) {
  return `
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
    <button type="button" class="btn btn-outline-secondary btn-sm mt-2" data-edit-feedback="${interviewId}">Edit Feedback</button>
  `;
}

function renderFeedbackPlaceholder(interviewId) {
  return `<button type="button" class="btn btn-login btn-sm mt-1" data-submit-feedback="${interviewId}">Submit Feedback</button>`;
}

// Delegate clicks for the dynamically-rendered Submit/Edit Feedback buttons.
document.addEventListener("click", (e) => {
  const submitBtn = e.target.closest("[data-submit-feedback]");
  const editBtn = e.target.closest("[data-edit-feedback]");
  if (submitBtn) showFeedbackForm(Number(submitBtn.dataset.submitFeedback), null);
  if (editBtn) loadAndShowFeedbackForm(Number(editBtn.dataset.editFeedback));
});

async function loadAndShowFeedbackForm(interviewId) {
  try {
    const response = await fetch(`${INT_API}/interviews/${interviewId}/feedback`, { headers: { ...getAuthHeader() } });
    const existing = response.ok ? await response.json() : null;
    showFeedbackForm(interviewId, existing);
  } catch (err) {
    showFeedbackForm(interviewId, null);
  }
}

// AC-30 (Interviewer submits feedback): same 5 criteria + comments as HR
// and Hiring Manager use, pre-filled on resubmission so it updates rather
// than overwrites blind.
function showFeedbackForm(interviewId, existing) {
  const area = document.getElementById(`feedbackArea-${interviewId}`);
  if (!area) return;

  const criteria = [
    { key: "technicalSkills", label: "Technical Skills" },
    { key: "communication", label: "Communication" },
    { key: "problemSolving", label: "Problem Solving" },
    { key: "culturalFit", label: "Cultural Fit" },
    { key: "overallRecommendation", label: "Overall Recommendation" },
  ];
  const scoreOptions = (selected) =>
    [1, 2, 3, 4, 5].map((n) => `<option value="${n}" ${selected === n ? "selected" : ""}>${n}</option>`).join("");

  area.innerHTML = `
    <div id="feedbackFormError-${interviewId}" class="alert alert-danger d-none py-2 small"></div>
    ${existing ? `<div class="alert alert-warning py-2 small">Feedback already exists for this interview — saving will update the existing record.</div>` : ""}
    <form id="feedbackForm-${interviewId}" novalidate>
      ${criteria.map((c) => `
        <div class="criteria-score-row">
          <label for="score_${interviewId}_${c.key}">${c.label} *</label>
          <select class="form-select form-select-sm" id="score_${interviewId}_${c.key}" required>
            <option value="">–</option>
            ${scoreOptions(existing ? existing[c.key] : null)}
          </select>
        </div>
      `).join("")}
      <div class="mt-3">
        <label class="form-label">Comments *</label>
        <textarea class="form-control" id="comments_${interviewId}" rows="3" required>${existing ? escapeHtml(existing.comments) : ""}</textarea>
      </div>
      <div class="d-flex justify-content-end gap-2 mt-3">
        <button type="button" class="btn btn-outline-secondary btn-sm" data-cancel-feedback="${interviewId}">Cancel</button>
        <button type="submit" class="btn btn-login btn-sm px-3">${existing ? "Update Feedback" : "Submit Feedback"}</button>
      </div>
    </form>
  `;

  area.querySelector(`[data-cancel-feedback="${interviewId}"]`).addEventListener("click", () => {
    area.innerHTML = existing ? renderFeedbackReadout(existing, interviewId) : renderFeedbackPlaceholder(interviewId);
  });

  area.querySelector(`#feedbackForm-${interviewId}`).addEventListener("submit", async (e) => {
    e.preventDefault();
    const errorBox = document.getElementById(`feedbackFormError-${interviewId}`);
    errorBox.classList.add("d-none");

    const values = {};
    let valid = true;
    criteria.forEach((c) => {
      const val = document.getElementById(`score_${interviewId}_${c.key}`).value;
      if (!val) valid = false;
      values[c.key] = Number(val);
    });
    const comments = document.getElementById(`comments_${interviewId}`).value.trim();
    if (!comments) valid = false;

    if (!valid) {
      errorBox.textContent = "Please complete every evaluation criterion and add comments before submitting.";
      errorBox.classList.remove("d-none");
      return;
    }

    try {
      const response = await fetch(`${INT_API}/interviews/${interviewId}/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeader() },
        body: JSON.stringify({ ...values, comments }),
      });
      if (!response.ok) {
        const errors = await response.json().catch(() => ({}));
        errorBox.textContent = Object.values(errors).join(" ") || "Please check the form and try again.";
        errorBox.classList.remove("d-none");
        return;
      }
      // Refresh underlying data so hasFeedback is current, then reopen
      // the details modal fresh with the saved values shown read-only.
      await loadInterviews();
      openDetails(interviewId);
    } catch (err) {
      errorBox.textContent = "Unable to reach the server. Please try again later.";
      errorBox.classList.remove("d-none");
    }
  });
}

if (guardIntAccess()) {
  loadInterviews();
}
