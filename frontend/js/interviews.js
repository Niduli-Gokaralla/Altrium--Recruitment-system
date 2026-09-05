const INTERVIEWS_READ_API = "http://localhost:8080/api/interviews";
const INTERVIEWS_WRITE_API = "http://localhost:8080/api/hr/interviews";
const CANDIDATES_API = "http://localhost:8080/api/hr/candidates";
const JOBS_API = "http://localhost:8080/api/hr/jobs";
const INTERVIEWERS_API = "http://localhost:8080/api/hr/users/interviewers";
const HIRING_MANAGERS_API = "http://localhost:8080/api/hr/users/hiring-managers";

const guardMessage = document.getElementById("guardMessage");
const pageContent = document.getElementById("pageContent");
const logoutBtn = document.getElementById("logoutBtn");

let allInterviews = [];
let allCandidates = [];
let allJobs = [];
let eligibleCandidatesForJob = [];

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

if (logoutBtn) logoutBtn.addEventListener("click", () => {
  sessionStorage.clear();
  window.location.href = "login.html";
});

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str || "";
  return div.innerHTML;
}

function calculateTotalScore(feedback) {
  const total = feedback.technicalSkills + feedback.communication +
                feedback.problemSolving + feedback.culturalFit +
                feedback.overallRecommendation;
  return Math.round((total / 5) * 10) / 10;
}

function statusLabel(status) {
  return {
    SCHEDULED: "Scheduled",
    COMPLETED: "Completed",
    CANCELLED: "Cancelled"
  }[status] || status;
}

const STAGE_DECISION_LABELS = {
  ADVANCE: "Advanced",
  REJECT: "Rejected at stage",
  ON_HOLD: "On Hold"
};

const STAGE_DECISION_BADGE_CLASS = {
  ADVANCE: "bg-success",
  REJECT: "bg-danger",
  ON_HOLD: "bg-warning text-dark"
};

function formatDate(value) {
  if (!value) return "";
  const d = new Date(value + "T00:00:00");
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric"
  });
}

function formatTime(value) {
  if (!value) return "";
  const [h, m] = value.split(":");
  const d = new Date();
  d.setHours(Number(h), Number(m));
  return d.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit"
  });
}

function formatDateTime(value) {
  if (!value) return "";
  return new Date(value).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  });
}

// ---------------------------------------------------------------------
// Loading data
// ---------------------------------------------------------------------

async function loadCandidatesForDropdown() {
  try {
    const response = await fetch(CANDIDATES_API, {
      headers: { ...getAuthHeader() }
    });

    if (!response.ok) throw new Error("Failed to load candidates");

    allCandidates = await response.json();
  } catch (err) {
    // Non-fatal — dropdown just stays empty
  }
}

async function loadJobsForDropdown() {
  try {
    const response = await fetch(JOBS_API, {
      headers: { ...getAuthHeader() }
    });

    if (!response.ok) throw new Error("Failed to load job openings");

    allJobs = await response.json();

    const select = document.getElementById("scheduleJobSelect");

    select.innerHTML =
      '<option value="">Select a job opening...</option>' +
      allJobs.map((j) =>
        `<option value="${j.id}">${escapeHtml(j.title)}</option>`
      ).join("");

  } catch (err) {
    // Non-fatal — dropdown just stays empty
  }
}

async function loadInterviews() {
  const loading = document.getElementById("interviewsLoading");
  const empty = document.getElementById("interviewsEmpty");
  const table = document.getElementById("interviewsTable");

  loading.classList.remove("d-none");
  empty.classList.add("d-none");
  table.classList.add("d-none");

  try {
    const response = await fetch(INTERVIEWS_READ_API, {
      headers: { ...getAuthHeader() }
    });

    if (!response.ok) throw new Error("Failed to load interviews");

    allInterviews = await response.json();

    populateStageFilter();
    applyFilters();

  } catch (err) {
    empty.textContent =
      "Could not load the interview schedule. Please refresh the page.";

    empty.classList.remove("d-none");

  } finally {
    loading.classList.add("d-none");
  }
}

function populateStageFilter() {
  const select = document.getElementById("stageFilter");
  const current = select.value;

  const stages = [
    ...new Set(allInterviews.map((i) => i.stage))
  ].sort();

  select.innerHTML =
    '<option value="">All stages</option>' +
    stages.map((s) =>
      `<option value="${escapeHtml(s)}">${escapeHtml(s)}</option>`
    ).join("");

  select.value = current;
}

// ---------------------------------------------------------------------
// Filtering (table)
// ---------------------------------------------------------------------

function applyFilters() {
  const search = document.getElementById("searchInput").value.trim().toLowerCase();
  const stage = document.getElementById("stageFilter").value;
  const status = document.getElementById("statusFilter").value;

  const filtered = allInterviews.filter((i) => {
    const matchesSearch =
      !search || i.candidateName.toLowerCase().includes(search);

    const matchesStage =
      !stage || i.stage === stage;

    const matchesStatus =
      !status || i.status === status;

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

// ---------------------------------------------------------------------
// Table rendering
// ---------------------------------------------------------------------

async function renderTable(interviews) {
  const tbody = document.getElementById("interviewsTableBody");
  const table = document.getElementById("interviewsTable");
  const empty = document.getElementById("interviewsEmpty");

  tbody.innerHTML = "";

  if (!interviews || interviews.length === 0) {
    table.classList.add("d-none");
    empty.classList.remove("d-none");
    return;
  }

  empty.classList.add("d-none");
  table.classList.remove("d-none");

  const scores = await Promise.all(
    interviews.map(async (i) => {
      if (!i.hasFeedback) return null;

      try {
        const response = await fetch(
          `${INTERVIEWS_READ_API}/${i.id}/feedback`,
          { headers: { ...getAuthHeader() } }
        );

        if (!response.ok) return null;

        const feedback = await response.json();
        return calculateTotalScore(feedback);

      } catch (err) {
        return null;
      }
    })
  );

  interviews.forEach((i, idx) => {
    const tr = document.createElement("tr");

    const statusClass = "status-" + i.status.toLowerCase();
    const score = scores[idx];

    const feedbackCell = score !== null
      ? `<span class="score-pill" style="cursor:pointer" data-action="edit-feedback" data-id="${i.id}">${score} / 5</span>`
      : `<button type="button" class="btn btn-sm btn-login" data-action="submit-feedback" data-id="${i.id}">Submit Feedback</button>`;

    const stageDecisionCell = i.stageDecision
      ? `<span class="badge ${STAGE_DECISION_BADGE_CLASS[i.stageDecision]}" title="${i.stageDecisionComment ? escapeHtml(i.stageDecisionComment) : ""}">${STAGE_DECISION_LABELS[i.stageDecision]}</span>`
      : `<span class="text-muted small">Pending</span>`;

    tr.innerHTML = `
      <td class="job-title-cell">${escapeHtml(i.candidateName)}</td>
      <td>${escapeHtml(i.jobOpeningTitle)}</td>
      <td>${formatDate(i.interviewDate)}, ${formatTime(i.interviewTime)}</td>
      <td>${escapeHtml(i.interviewer)}</td>
      <td>${escapeHtml(i.stage)}</td>
      <td>${feedbackCell}</td>
      <td>${stageDecisionCell}</td>
      <td><span class="status-badge ${statusClass}">${statusLabel(i.status)}</span></td>
      <td class="text-end">
        <button class="action-btn" title="View" data-action="view" data-id="${i.id}">
          <i class="bi bi-eye"></i>
        </button>
        <button class="action-btn" title="Edit" data-action="edit" data-id="${i.id}">
          <i class="bi bi-pencil"></i>
        </button>
        <button class="action-btn text-danger" title="Delete" data-action="delete" data-id="${i.id}">
          <i class="bi bi-trash"></i>
        </button>
      </td>
    `;

    tbody.appendChild(tr);
  });
}

document.getElementById("interviewsTableBody").addEventListener("click", async (e) => {
  const feedbackTrigger =
    e.target.closest('[data-action="submit-feedback"], [data-action="edit-feedback"]');

  if (feedbackTrigger) {
    const id = Number(feedbackTrigger.dataset.id);
    await openDetailsAndShowFeedbackForm(id);
    return;
  }

  const btn = e.target.closest(".action-btn");

  if (!btn) return;

  const id = Number(btn.dataset.id);
  const action = btn.dataset.action;

  if (action === "view") openDetails(id);
  if (action === "edit") openEditForm(id);
  if (action === "delete") deleteInterview(id);
});

async function openDetailsAndShowFeedbackForm(id) {
  const i = allInterviews.find((x) => x.id === id);

  if (!i) return;

  await openDetails(id);

  let existingFeedback = null;

  if (i.hasFeedback) {
    try {
      const response = await fetch(
        `${INTERVIEWS_READ_API}/${id}/feedback`,
        { headers: { ...getAuthHeader() } }
      );

      if (response.ok) existingFeedback = await response.json();

    } catch (err) {
      // fall through
    }
  }

  renderFeedbackForm(id, existingFeedback);
}

// ---------------------------------------------------------------------
// Create / Edit form — Job Position first, then searchable Candidate
// ---------------------------------------------------------------------

const interviewForm = document.getElementById("interviewForm");
const formSuccess = document.getElementById("formSuccess");
const formError = document.getElementById("formError");
const submitBtn = document.getElementById("submitBtn");
const btnText = submitBtn.querySelector(".btn-text");
const spinner = document.getElementById("submitSpinner");
const interviewFormModalEl = document.getElementById("interviewFormModal");

const candidateSearchInput = document.getElementById("candidateSearchInput");
const candidateSelectHidden = document.getElementById("candidateSelect");
const candidateSearchResults = document.getElementById("candidateSearchResults");
const candidateSelectError = document.getElementById("candidateSelectError");

document.getElementById("openCreateBtn").addEventListener("click", () => {
  resetForm();
  document.getElementById("interviewFormModalTitle").textContent = "Schedule Interview";
  btnText.textContent = "Schedule Interview";
  new bootstrap.Modal(interviewFormModalEl).show();
});

function resetForm() {
  interviewForm.reset();
  interviewForm.classList.remove("was-validated");
  formSuccess.classList.add("d-none");
  formError.classList.add("d-none");

  document.getElementById("interviewId").value = "";

  candidateSelectHidden.value = "";
  candidateSearchInput.value = "";
  candidateSearchInput.disabled = true;
  candidateSearchInput.placeholder = "Select a job position first...";
  candidateSearchResults.style.display = "none";
  candidateSelectError.style.display = "none";

  eligibleCandidatesForJob = [];
}

// AC: Job Position drives which candidates can be picked.
document.getElementById("scheduleJobSelect").addEventListener("change", (e) => {
  const jobId = e.target.value;

  candidateSearchInput.value = "";
  candidateSelectHidden.value = "";
  candidateSearchResults.style.display = "none";

  if (!jobId) {
    eligibleCandidatesForJob = [];
    candidateSearchInput.disabled = true;
    candidateSearchInput.placeholder = "Select a job position first...";
    return;
  }

  // UPDATED: support all interview stages
  const INTERVIEW_STAGES = [
    "SHORTLISTED",
    "HR Interview",
    "Technical Interview",
    "Final Interview"
  ];

  eligibleCandidatesForJob = allCandidates.filter((c) =>
    String(c.jobOpeningId) === jobId &&
    INTERVIEW_STAGES.includes(c.stage)
  );

  candidateSearchInput.disabled = false;

  candidateSearchInput.placeholder =
    eligibleCandidatesForJob.length > 0
      ? "Type to search candidates..."
      : "No shortlisted candidates for this job yet";
});

function renderCandidateSearchResults(matches) {
  if (matches.length === 0) {
    candidateSearchResults.innerHTML =
      `<div class="list-group-item text-muted small">No matching candidates.</div>`;
  } else {
    candidateSearchResults.innerHTML = matches.map((c) => `
      <button type="button"
              class="list-group-item list-group-item-action"
              data-id="${c.id}">
        ${escapeHtml(c.fullName)}
      </button>
    `).join("");
  }

  candidateSearchResults.style.display = "block";
}

candidateSearchInput.addEventListener("input", () => {
  candidateSelectHidden.value = "";

  const query = candidateSearchInput.value.trim().toLowerCase();

  const matches = query
    ? eligibleCandidatesForJob.filter((c) =>
        c.fullName.toLowerCase().includes(query)
      )
    : eligibleCandidatesForJob;

  renderCandidateSearchResults(matches);
});

candidateSearchInput.addEventListener("focus", () => {
  if (!candidateSearchInput.disabled) {
    renderCandidateSearchResults(eligibleCandidatesForJob);
  }
});

candidateSearchResults.addEventListener("click", (e) => {
  const btn = e.target.closest("[data-id]");

  if (!btn) return;

  const candidate = eligibleCandidatesForJob.find(
    (c) => String(c.id) === btn.dataset.id
  );

  if (!candidate) return;

  candidateSearchInput.value = candidate.fullName;
  candidateSelectHidden.value = candidate.id;
  candidateSearchResults.style.display = "none";
  candidateSelectError.style.display = "none";
});

document.addEventListener("click", (e) => {
  if (
    !candidateSearchResults.contains(e.target) &&
    e.target !== candidateSearchInput
  ) {
    candidateSearchResults.style.display = "none";
  }
});

function openEditForm(id) {
  const i = allInterviews.find((x) => x.id === id);

  if (!i) return;

  resetForm();

  document.getElementById("interviewFormModalTitle").textContent = "Edit Interview";
  btnText.textContent = "Save Changes";

  document.getElementById("interviewId").value = i.id;

  // Prefill Job Position from the candidate's own record.
  const candidate = allCandidates.find((c) => c.id === i.candidateId);
  const jobId = candidate ? String(candidate.jobOpeningId) : "";

  document.getElementById("scheduleJobSelect").value = jobId;

  if (jobId) {

    // UPDATED: support all interview stages
    const INTERVIEW_STAGES = [
      "SHORTLISTED",
      "HR Interview",
      "Technical Interview",
      "Final Interview"
    ];

    eligibleCandidatesForJob = allCandidates.filter((c) =>
      String(c.jobOpeningId) === jobId &&
      INTERVIEW_STAGES.includes(c.stage)
    );
  }

  candidateSearchInput.disabled = false;
  candidateSearchInput.value = i.candidateName;
  candidateSelectHidden.value = i.candidateId;

  document.getElementById("interviewDate").value = i.interviewDate;
  document.getElementById("interviewTime").value = i.interviewTime;
  document.getElementById("interviewerSelect").value = i.interviewer;
  document.getElementById("hiringManagerSelect").value = i.hiringManager || "";
  document.getElementById("interviewStage").value = i.stage;
  document.getElementById("interviewStatus").value = i.status;

  new bootstrap.Modal(interviewFormModalEl).show();
}

function setSubmitting(isSubmitting) {
  submitBtn.disabled = isSubmitting;
  spinner.classList.toggle("d-none", !isSubmitting);
}

interviewForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  formSuccess.classList.add("d-none");
  formError.classList.add("d-none");
  interviewForm.classList.remove("was-validated");
  candidateSelectError.style.display = "none";

  if (!interviewForm.checkValidity()) {
    interviewForm.classList.add("was-validated");
    return;
  }

  if (!candidateSelectHidden.value) {
    candidateSelectError.textContent =
      "Please select a candidate from the search results.";

    candidateSelectError.style.display = "block";
    return;
  }

  const id = document.getElementById("interviewId").value;

  const payload = {
    candidateId: Number(candidateSelectHidden.value),
    interviewDate: document.getElementById("interviewDate").value,
    interviewTime: document.getElementById("interviewTime").value,
    interviewer: document.getElementById("interviewerSelect").value,
    hiringManager: document.getElementById("hiringManagerSelect").value,
    stage: document.getElementById("interviewStage").value,
    status: document.getElementById("interviewStatus").value
  };

  const isEdit = !!id;

  const url = isEdit
    ? `${INTERVIEWS_WRITE_API}/${id}`
    : INTERVIEWS_WRITE_API;

  const method = isEdit ? "PUT" : "POST";

  setSubmitting(true);

  try {
    const response = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeader()
      },
      body: JSON.stringify(payload)
    });

    if (response.status === 401 || response.status === 403) {
      formError.textContent =
        "You are not authorized to perform this action.";

      formError.classList.remove("d-none");
      return;
    }

    if (!response.ok) {
      const errors = await response.json();
      const messages = Object.values(errors).join(" ");

      formError.textContent =
        messages || "Please check the form and try again.";

      formError.classList.remove("d-none");
      return;
    }

    formSuccess.textContent = isEdit
      ? "Interview updated successfully."
      : "Interview scheduled successfully.";

    formSuccess.classList.remove("d-none");

    await loadInterviews();

    setTimeout(() => {
      const modalInstance =
        bootstrap.Modal.getInstance(interviewFormModalEl);

      if (modalInstance) modalInstance.hide();
    }, 900);

  } catch (err) {
    formError.textContent =
      "Unable to reach the server. Please try again later.";

    formError.classList.remove("d-none");

  } finally {
    setSubmitting(false);
  }
});

// ---------------------------------------------------------------------
// Delete
// ---------------------------------------------------------------------

async function deleteInterview(id) {
  const i = allInterviews.find((x) => x.id === id);

  if (!i) return;

  if (
    !confirm(
      `Delete the interview with ${i.candidateName}? This cannot be undone.`
    )
  ) {
    return;
  }

  try {
    const response = await fetch(
      `${INTERVIEWS_WRITE_API}/${id}`,
      {
        method: "DELETE",
        headers: { ...getAuthHeader() }
      }
    );

    if (!response.ok && response.status !== 204) {
      throw new Error("Delete failed");
    }

    await loadInterviews();

  } catch (err) {
    alert("Could not delete this interview. Please try again.");
  }
}

// ---------------------------------------------------------------------
// Details + Feedback
// ---------------------------------------------------------------------

async function openDetails(id) {
  const i = allInterviews.find((x) => x.id === id);

  if (!i) return;

  document.getElementById("detailsTitle").textContent =
    `${i.candidateName} — ${i.stage}`;

  let feedback = null;

  if (i.hasFeedback) {
    try {
      const response = await fetch(
        `${INTERVIEWS_READ_API}/${id}/feedback`,
        { headers: { ...getAuthHeader() } }
      );

      if (response.ok) {
        feedback = await response.json();
      }

    } catch (err) {
      // Show empty-feedback state
    }
  }

  const statusClass = "status-" + i.status.toLowerCase();

  const feedbackSectionHtml = feedback
    ? renderFeedbackReadout(feedback)
    : `
      <div class="no-feedback-note mb-3">
        No feedback submitted yet for this interview.
      </div>
    `;

  const stageDecisionHtml = i.stageDecision
    ? `
      <div class="details-meta-row">
        <span>Stage Decision</span>
        <span>
          <span class="badge ${STAGE_DECISION_BADGE_CLASS[i.stageDecision]}">
            ${STAGE_DECISION_LABELS[i.stageDecision]}
          </span>
        </span>
      </div>

      ${
        i.stageDecisionComment
          ? `<div class="details-meta-row">
               <span>Decision Comment</span>
               <span>${escapeHtml(i.stageDecisionComment)}</span>
             </div>`
          : ""
      }

      <div class="details-meta-row">
        <span>Decided By</span>
        <span>
          ${escapeHtml(i.stageDecisionBy)}
          on ${formatDateTime(i.stageDecisionAt)}
        </span>
      </div>
    `
    : `
      <div class="details-meta-row">
        <span>Stage Decision</span>
        <span class="text-muted small">
          Not yet decided by the Hiring Manager
        </span>
      </div>
    `;

  document.getElementById("detailsBody").innerHTML = `
    <div class="details-section">
      <div class="details-meta-row">
        <span>Candidate</span>
        <span>${escapeHtml(i.candidateName)}</span>
      </div>

      <div class="details-meta-row">
        <span>Position</span>
        <span>${escapeHtml(i.jobOpeningTitle)}</span>
      </div>

      <div class="details-meta-row">
        <span>Date &amp; Time</span>
        <span>
          ${formatDate(i.interviewDate)}, ${formatTime(i.interviewTime)}
        </span>
      </div>

      <div class="details-meta-row">
        <span>Interviewer</span>
        <span>${escapeHtml(i.interviewer)}</span>
      </div>

      <div class="details-meta-row">
        <span>Hiring Manager</span>
        <span>${escapeHtml(i.hiringManager) || "—"}</span>
      </div>

      <div class="details-meta-row">
        <span>Stage</span>
        <span>${escapeHtml(i.stage)}</span>
      </div>

      <div class="details-meta-row">
        <span>Status</span>
        <span>
          <span class="status-badge ${statusClass}">
            ${statusLabel(i.status)}
          </span>
        </span>
      </div>

      ${stageDecisionHtml}
    </div>

    <h6 class="section-heading">Interview Feedback</h6>

    <div id="feedbackSection">
      ${feedbackSectionHtml}
    </div>

    <div class="d-flex justify-content-end mt-3">
      <button
        class="btn btn-login btn-sm px-3"
        id="feedbackToggleBtn"
      >
        ${feedback ? "Edit Feedback" : "Submit Feedback"}
      </button>
    </div>

    <div id="feedbackFormWrapper" class="mt-3 d-none"></div>
  `;

  document.getElementById("feedbackToggleBtn").addEventListener("click", () => {
    renderFeedbackForm(i.id, feedback);
  });

  new bootstrap.Modal(
    document.getElementById("interviewDetailsModal")
  ).show();
}

function scoreLabel(n) {
  return {
    1: "1 – Poor",
    2: "2 – Below Average",
    3: "3 – Average",
    4: "4 – Good",
    5: "5 – Excellent"
  }[n] || n;
}

function renderFeedbackReadout(feedback) {
  const totalScore = calculateTotalScore(feedback);

  return `
    <div class="feedback-readout">
      <span>Technical Skills</span>
      <span class="score-pill">${feedback.technicalSkills}</span>
    </div>

    <div class="feedback-readout">
      <span>Communication</span>
      <span class="score-pill">${feedback.communication}</span>
    </div>

    <div class="feedback-readout">
      <span>Problem Solving</span>
      <span class="score-pill">${feedback.problemSolving}</span>
    </div>

    <div class="feedback-readout">
      <span>Cultural Fit</span>
      <span class="score-pill">${feedback.culturalFit}</span>
    </div>

    <div class="feedback-readout">
      <span>Overall Recommendation</span>
      <span class="score-pill">${feedback.overallRecommendation}</span>
    </div>

    <div
      class="feedback-readout"
      style="border-top: 2px solid #16324f; margin-top: 4px; padding-top: 8px;"
    >
      <span style="font-weight:700;">Total Score</span>
      <span class="score-pill" style="background:#16324f;">
        ${totalScore} / 5
      </span>
    </div>

    <div class="mt-2">
      <div
        class="field-label"
        style="font-size:0.72rem;color:#8a8a8a;"
      >
        Comments
      </div>

      <div style="white-space: pre-wrap; font-size: 0.88rem;">
        ${escapeHtml(feedback.comments)}
      </div>
    </div>

    <div class="small text-muted mt-2">
      Submitted by ${escapeHtml(feedback.submittedBy)}
      on ${new Date(feedback.submittedAt).toLocaleString()}
    </div>
  `;
}

function renderFeedbackForm(interviewId, existingFeedback) {
  const wrapper = document.getElementById("feedbackFormWrapper");

  const criteria = [
    { key: "technicalSkills", label: "Technical Skills" },
    { key: "communication", label: "Communication" },
    { key: "problemSolving", label: "Problem Solving" },
    { key: "culturalFit", label: "Cultural Fit" },
    { key: "overallRecommendation", label: "Overall Recommendation" }
  ];

  const scoreOptions = (selected) =>
    [1, 2, 3, 4, 5]
      .map(
        (n) =>
          `<option value="${n}" ${
            selected === n ? "selected" : ""
          }>${n}</option>`
      )
      .join("");

  wrapper.innerHTML = `
    <div
      id="feedbackFormError"
      class="alert alert-danger d-none py-2 small"
    ></div>

    ${
      existingFeedback
        ? `<div class="alert alert-warning py-2 small">
             Feedback already exists for this interview — saving will update
             the existing record, not create a duplicate.
           </div>`
        : ""
    }

    <form id="feedbackForm" novalidate>

      ${criteria
        .map(
          (c) => `
            <div class="feedback-score-row">
              <label for="score_${c.key}">
                ${c.label} *
              </label>

              <select
                class="form-select form-select-sm"
                id="score_${c.key}"
                required
              >
                <option value="">–</option>
                ${scoreOptions(
                  existingFeedback
                    ? existingFeedback[c.key]
                    : null
                )}
              </select>
            </div>
          `
        )
        .join("")}

      <div class="mt-3">
        <label
          for="feedbackComments"
          class="form-label"
        >
          Comments *
        </label>

        <textarea
          class="form-control"
          id="feedbackComments"
          rows="3"
          required
        >${
          existingFeedback
            ? escapeHtml(existingFeedback.comments)
            : ""
        }</textarea>
      </div>

      <div class="d-flex justify-content-end gap-2 mt-3">

        <button
          type="button"
          class="btn btn-outline-secondary btn-sm"
          id="feedbackCancelBtn"
        >
          Cancel
        </button>

        <button
          type="submit"
          class="btn btn-login btn-sm px-3"
          id="feedbackSubmitBtn"
        >
          ${existingFeedback ? "Update Feedback" : "Submit Feedback"}
        </button>

      </div>

    </form>
  `;

  wrapper.classList.remove("d-none");

  document
    .getElementById("feedbackCancelBtn")
    .addEventListener("click", () => {
      wrapper.classList.add("d-none");
      wrapper.innerHTML = "";
    });

  document
    .getElementById("feedbackForm")
    .addEventListener("submit", async (e) => {

      e.preventDefault();

      const errorBox =
        document.getElementById("feedbackFormError");

      errorBox.classList.add("d-none");

      const values = {};
      let valid = true;

      criteria.forEach((c) => {
        const val =
          document.getElementById(`score_${c.key}`).value;

        if (!val) valid = false;

        values[c.key] = Number(val);
      });

      const comments =
        document.getElementById("feedbackComments").value.trim();

      if (!comments) valid = false;

      if (!valid) {
        errorBox.textContent =
          "Please complete every evaluation criterion and add comments before submitting.";

        errorBox.classList.remove("d-none");
        return;
      }

      try {
        const response = await fetch(
          `${INTERVIEWS_WRITE_API}/${interviewId}/feedback`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...getAuthHeader()
            },
            body: JSON.stringify({
              ...values,
              comments
            })
          }
        );

        if (!response.ok) {
          const errors = await response.json();

          errorBox.textContent =
            Object.values(errors).join(" ") ||
            "Please check the form and try again.";

          errorBox.classList.remove("d-none");
          return;
        }

        await loadInterviews();

        bootstrap.Modal
          .getInstance(
            document.getElementById("interviewDetailsModal")
          )
          .hide();

        openDetails(interviewId);

      } catch (err) {
        errorBox.textContent =
          "Unable to reach the server. Please try again later.";

        errorBox.classList.remove("d-none");
      }
    });
}

async function loadInterviewersForDropdown() {
  try {
    const response = await fetch(INTERVIEWERS_API, {
      headers: { ...getAuthHeader() }
    });

    if (!response.ok) {
      throw new Error("Failed to load interviewers");
    }

    const usernames = await response.json();

    const select =
      document.getElementById("interviewerSelect");

    select.innerHTML =
      '<option value="">Select an interviewer...</option>' +
      usernames
        .map(
          (u) =>
            `<option value="${escapeHtml(u)}">${escapeHtml(u)}</option>`
        )
        .join("");

  } catch (err) {
    // Non-fatal — dropdown just stays empty
  }
}

// AC: HR picks a Hiring Manager per interview.
async function loadHiringManagersForDropdown() {
  try {
    const response = await fetch(HIRING_MANAGERS_API, {
      headers: { ...getAuthHeader() }
    });

    if (!response.ok) {
      throw new Error("Failed to load hiring managers");
    }

    const usernames = await response.json();

    const select =
      document.getElementById("hiringManagerSelect");

    select.innerHTML =
      '<option value="">Select a hiring manager...</option>' +
      usernames
        .map(
          (u) =>
            `<option value="${escapeHtml(u)}">${escapeHtml(u)}</option>`
        )
        .join("");

  } catch (err) {
    // Non-fatal — dropdown just stays empty
  }
}

if (guardHrAccess()) {
  Promise
    .all([
      loadCandidatesForDropdown(),
      loadJobsForDropdown()
    ])
    .then(loadInterviews);

  loadInterviewersForDropdown();
  loadHiringManagersForDropdown();
}
