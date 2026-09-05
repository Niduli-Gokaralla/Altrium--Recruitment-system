let myCandidates = [];
let myInterviews = [];

const ROLE_LABELS = { HR: "HR", HIRING_MANAGER: "Hiring Manager (You)", INTERVIEWER: "Interviewer" };
const ROLE_ORDER = ["HR", "HIRING_MANAGER", "INTERVIEWER"];

function scoreFromFeedback(feedback) {
  return ((feedback.technicalSkills + feedback.communication + feedback.problemSolving + feedback.culturalFit) / 4) * 20;
}

function recommendationLabel(avgRecommendation) {
  if (avgRecommendation === null || avgRecommendation === undefined) return "—";
  if (avgRecommendation >= 4) return "Recommended";
  if (avgRecommendation >= 2.5) return "Neutral";
  return "Not Recommended";
}

const STAGE_DECISION_LABELS = { ADVANCE: "Advanced", REJECT: "Rejected at this stage", ON_HOLD: "On Hold" };
const STAGE_DECISION_BADGE_CLASS = { ADVANCE: "bg-success", REJECT: "bg-danger", ON_HOLD: "bg-warning text-dark" };

async function fetchAllFeedbackForInterview(interviewId) {
  try {
    const response = await fetch(`${HM_API}/interviews/${interviewId}/feedback-all`, { headers: { ...getAuthHeader() } });
    return response.ok ? await response.json() : [];
  } catch (err) {
    return [];
  }
}

async function loadData() {
  const loading = document.getElementById("candidatesLoading");
  const empty = document.getElementById("candidatesEmpty");

  loading.classList.remove("d-none");
  try {
    const [candidatesRes, interviewsRes] = await Promise.all([
      fetch(`${HM_API}/candidates`, { headers: { ...getAuthHeader() } }),
      fetch(`${HM_API}/interviews`, { headers: { ...getAuthHeader() } }),
    ]);
    if (!candidatesRes.ok || !interviewsRes.ok) throw new Error("Failed to load data");
    const allCandidates = await candidatesRes.json();
    myInterviews = await interviewsRes.json();

    const INTERVIEW_STAGES = ["HR Interview", "Technical Interview", "Final Interview"];
    myCandidates = allCandidates.filter((c) => INTERVIEW_STAGES.includes(c.stage));

    await renderList();
  } catch (err) {
    empty.textContent = "Could not load candidates. Please refresh the page.";
    empty.classList.remove("d-none");
  } finally {
    loading.classList.add("d-none");
  }
}

function candidateInterviews(candidateId) {
  return myInterviews.filter((i) => i.candidateId === candidateId);
}

async function buildCandidateFeedbackSummary(candidateId) {
  const interviews = candidateInterviews(candidateId);
  const perInterview = await Promise.all(interviews.map(async (interview) => {
    const allFeedback = await fetchAllFeedbackForInterview(interview.id);
    if (allFeedback.length === 0) {
      return { interview, feedback: [], score: null, recommendation: null };
    }
    const score = allFeedback.reduce((sum, f) => sum + scoreFromFeedback(f), 0) / allFeedback.length;
    const recommendation = allFeedback.reduce((sum, f) => sum + f.overallRecommendation, 0) / allFeedback.length;
    return { interview, feedback: allFeedback, score, recommendation };
  }));

  const scored = perInterview.filter((p) => p.score !== null);
  const overallScore = scored.length > 0 ? scored.reduce((sum, p) => sum + p.score, 0) / scored.length : null;
  const overallRecommendation = scored.length > 0 ? scored.reduce((sum, p) => sum + p.recommendation, 0) / scored.length : null;

  return { perInterview, overallScore, overallRecommendation };
}

async function renderList() {
  const empty = document.getElementById("candidatesEmpty");
  const list = document.getElementById("candidatesList");

  if (!myCandidates || myCandidates.length === 0) {
    empty.classList.remove("d-none");
    list.innerHTML = "";
    return;
  }
  empty.classList.add("d-none");

  list.innerHTML = `<div class="text-muted small">Loading interview scores...</div>`;

  const rows = await Promise.all(myCandidates.map(async (c) => {
    const interviews = candidateInterviews(c.id);
    const summary = await buildCandidateFeedbackSummary(c.id);
    const latest = [...interviews].sort((a, b) => (b.interviewDate + b.interviewTime).localeCompare(a.interviewDate + a.interviewTime))[0];
    return { candidate: c, interviews, summary, latest };
  }));

  list.innerHTML = `
    <div class="table-responsive">
      <table class="table jobs-table align-middle">
        <thead>
          <tr>
            <th>Candidate</th>
            <th>Position</th>
            <th>Interview Stage</th>
            <th>Interview Date</th>
            <th>Interviewer</th>
            <th>Interview Score</th>
            <th>Status</th>
            <th class="text-end">Action</th>
          </tr>
        </thead>
        <tbody>
          ${rows.map(({ candidate, interviews, summary, latest }) => `
            <tr>
              <td class="job-title-cell">${escapeHtml(candidate.fullName)}</td>
              <td>${escapeHtml(candidate.jobOpeningTitle)}</td>
              <td>${latest ? escapeHtml(latest.stage) : "—"}${interviews.length > 1 ? ` <span class="text-muted small">(+${interviews.length - 1} more)</span>` : ""}</td>
              <td>${latest ? formatDate(latest.interviewDate) : "—"}</td>
              <td>${latest ? escapeHtml(latest.interviewer) : "—"}</td>
              <td>${summary.overallScore !== null ? `<span class="score-pill">${summary.overallScore.toFixed(0)}/100</span>` : `<span class="text-muted small">No feedback yet</span>`}</td>
              <td>${STAGE_LABELS[candidate.stage] || candidate.stage}</td>
              <td class="text-end"><button class="btn btn-login btn-sm px-3" data-id="${candidate.id}">Feedback</button></td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
  `;

  list.querySelectorAll("button[data-id]").forEach((btn) => {
    btn.addEventListener("click", () => openCandidateModal(Number(btn.dataset.id)));
  });
}

async function openCandidateModal(candidateId) {
  const c = myCandidates.find((x) => x.id === candidateId);
  if (!c) return;

  document.getElementById("candidateModalTitle").textContent = `${c.fullName} — ${c.jobOpeningTitle}`;
  document.getElementById("candidateModalBody").innerHTML = `<div class="text-muted small">Loading feedback...</div>`;
  new bootstrap.Modal(document.getElementById("candidateModal")).show();

  const summary = await buildCandidateFeedbackSummary(candidateId);
  const interviewSections = summary.perInterview.map((p) => renderInterviewSection(p, candidateId));

  const historyRows = summary.perInterview.map((p) => `
    <tr>
      <td>${escapeHtml(p.interview.stage)}</td>
      <td>${escapeHtml(p.interview.interviewer)}</td>
      <td>${p.score !== null ? p.score.toFixed(0) : "—"}</td>
      <td>${recommendationLabel(p.recommendation)}</td>
      <td>${formatDate(p.interview.interviewDate)}</td>
    </tr>
  `).join("");

  const hasFeedback = summary.overallScore !== null;

  document.getElementById("candidateModalBody").innerHTML = `
    ${hasFeedback ? `
      <div class="details-section">
        <h6 class="section-heading" style="margin-top:0;">Overall Interview Performance</h6>
        <div class="details-meta-row"><span><strong>Overall Interview Score</strong></span><span><strong>${summary.overallScore.toFixed(0)}/100</strong></span></div>
        <div class="details-meta-row"><span>Interviewer Recommendation</span><span>${recommendationLabel(summary.overallRecommendation)}</span></div>
      </div>
    ` : ""}

    <div class="details-section">
      <h6 class="section-heading">Interview History</h6>
      <div class="table-responsive">
        <table class="table jobs-table align-middle" style="font-size:0.85rem;">
          <thead><tr><th>Stage</th><th>Interviewer</th><th>Score</th><th>Recommendation</th><th>Date</th></tr></thead>
          <tbody>${historyRows}</tbody>
        </table>
      </div>
    </div>

    <h6 class="section-heading">Interview Feedback &amp; Stage Decisions</h6>
    ${interviewSections.join("")}

    <h6 class="section-heading">Final Decision</h6>
    <div id="decisionArea">
      ${hasFeedback ? `
        <div class="d-flex gap-2">
          <button class="btn btn-outline-success btn-sm" data-decision="HIRED">Hire</button>
          <button class="btn btn-outline-danger btn-sm" data-decision="REJECTED">Reject</button>
          <button class="btn btn-outline-warning btn-sm" data-decision="ON_HOLD">On Hold</button>
        </div>
      ` : `
        <div class="text-muted small">At least one interview needs feedback submitted before a final decision can be made.</div>
      `}
    </div>
    <div id="decisionMessage" class="alert alert-success mt-3 d-none py-2 small"></div>
  `;

  document.getElementById("decisionArea").querySelectorAll("[data-decision]").forEach((btn) => {
    btn.addEventListener("click", () => showDecisionConfirmation(candidateId, btn.dataset.decision));
  });

  document.querySelectorAll("[data-stage-decision]").forEach((btn) => {
    btn.addEventListener("click", () => showStageDecisionConfirmation(candidateId, Number(btn.dataset.interviewId), btn.dataset.stageDecision));
  });
}

const DECISION_LABELS = { HIRED: "Hire", REJECTED: "Reject", ON_HOLD: "put On Hold" };

function showDecisionConfirmation(candidateId, decision) {
  const area = document.getElementById("decisionArea");
  area.innerHTML = `
    <div class="alert alert-warning py-2 small mb-2">
      Are you sure you want to ${DECISION_LABELS[decision]} this candidate?
    </div>
    <div class="mb-3">
      <label class="form-label">Decision Comment (optional)</label>
      <textarea class="form-control" id="decisionComment" rows="2" placeholder="e.g. Strong technical performance and good overall interview results."></textarea>
    </div>
    <div class="d-flex gap-2">
      <button type="button" class="btn btn-outline-secondary btn-sm" id="cancelDecisionBtn">Cancel</button>
      <button type="button" class="btn btn-login btn-sm px-3" id="confirmDecisionBtn">Confirm Decision</button>
    </div>
  `;

  document.getElementById("cancelDecisionBtn").addEventListener("click", () => openCandidateModal(candidateId));
  document.getElementById("confirmDecisionBtn").addEventListener("click", () => {
    const comment = document.getElementById("decisionComment").value.trim();
    makeDecision(candidateId, decision, comment);
  });
}

const STAGE_DECISION_ACTION_LABELS = { ADVANCE: "advance this candidate to the next stage", REJECT: "reject this candidate at this stage", ON_HOLD: "put this stage on hold" };

// AC: a per-STAGE decision — separate from the final decision above.
// Recorded on the individual interview only; never changes the
// candidate's overall stage.
function showStageDecisionConfirmation(candidateId, interviewId, decision) {
  const area = document.getElementById(`stage-decision-area-${interviewId}`);
  if (!area) return;

  area.innerHTML = `
    <div class="alert alert-warning py-2 small mb-2">
      Are you sure you want to ${STAGE_DECISION_ACTION_LABELS[decision]}?
    </div>
    <div class="mb-2">
      <textarea class="form-control form-control-sm" id="stageDecisionComment-${interviewId}" rows="2" placeholder="Optional comment about this stage..."></textarea>
    </div>
    <div class="d-flex gap-2">
      <button type="button" class="btn btn-outline-secondary btn-sm" id="cancelStageDecisionBtn-${interviewId}">Cancel</button>
      <button type="button" class="btn btn-login btn-sm px-3" id="confirmStageDecisionBtn-${interviewId}">Confirm Decision</button>
    </div>
  `;

  document.getElementById(`cancelStageDecisionBtn-${interviewId}`).addEventListener("click", () => openCandidateModal(candidateId));
  document.getElementById(`confirmStageDecisionBtn-${interviewId}`).addEventListener("click", () => {
    const comment = document.getElementById(`stageDecisionComment-${interviewId}`).value.trim();
    makeStageDecision(candidateId, interviewId, decision, comment);
  });
}

async function makeStageDecision(candidateId, interviewId, decision, comment) {
  try {
    const response = await fetch(`${HM_API}/interviews/${interviewId}/stage-decision`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...getAuthHeader() },
      body: JSON.stringify({ decision, comment }),
    });
    if (!response.ok) {
      const errBody = await response.json().catch(() => ({}));
      alert(errBody.message || "Could not save this stage decision. Please try again.");
      return;
    }
    await loadData();
    openCandidateModal(candidateId);
  } catch (err) {
    alert("Could not save this stage decision. Please try again.");
  }
}

// Renders one interview's feedback (3-role comparison, unchanged) plus
// a new Stage Decision block underneath it.
function renderInterviewSection(perInterview, candidateId) {
  const { interview, feedback } = perInterview;
  const feedbackByRole = {};
  feedback.forEach((f) => { feedbackByRole[f.evaluatorRole] = f; });

  const columns = ROLE_ORDER.map((role) => {
    const f = feedbackByRole[role];
    const isMine = role === "HIRING_MANAGER";
    const body = f
      ? renderFeedbackReadout(f, interview.id, isMine)
      : (isMine ? renderFeedbackFormPlaceholder(interview.id) : `<div class="text-muted small">No feedback submitted yet.</div>`);
    return `
      <div class="feedback-compare-col">
        <div class="feedback-compare-role">${ROLE_LABELS[role]}</div>
        <div id="feedback-area-${interview.id}-${role}">${body}</div>
      </div>
    `;
  }).join("");

  const hasAnyFeedback = feedback.length > 0;
  let stageDecisionHtml;
  if (interview.stageDecision) {
    stageDecisionHtml = `
      <span class="badge ${STAGE_DECISION_BADGE_CLASS[interview.stageDecision]}">${STAGE_DECISION_LABELS[interview.stageDecision]}</span>
      ${interview.stageDecisionComment ? `<div class="small text-muted mt-1">${escapeHtml(interview.stageDecisionComment)}</div>` : ""}
      <div class="small text-muted mt-1">Decided by ${escapeHtml(interview.stageDecisionBy)} on ${formatDateTime(interview.stageDecisionAt)}</div>
    `;
  } else if (hasAnyFeedback) {
    stageDecisionHtml = `
      <div class="d-flex gap-2">
        <button class="btn btn-outline-success btn-sm" data-stage-decision="ADVANCE" data-interview-id="${interview.id}">Advance to Next Stage</button>
        <button class="btn btn-outline-danger btn-sm" data-stage-decision="REJECT" data-interview-id="${interview.id}">Reject</button>
        <button class="btn btn-outline-warning btn-sm" data-stage-decision="ON_HOLD" data-interview-id="${interview.id}">On Hold</button>
      </div>
    `;
  } else {
    stageDecisionHtml = `<div class="text-muted small">Feedback needed before a stage decision can be made.</div>`;
  }

  return `
    <div class="details-section">
      <h6 class="section-heading" style="margin-top:0;">${escapeHtml(interview.stage)} — ${formatDate(interview.interviewDate)}, ${formatTime(interview.interviewTime)}</h6>
      <div class="details-meta-row"><span>Interviewer</span><span>${escapeHtml(interview.interviewer)}</span></div>
      <div class="feedback-compare-row">${columns}</div>
      <div class="mt-3 pt-3" style="border-top: 1px solid #eee;">
        <div class="small text-muted mb-2" style="font-weight:600;">Stage Decision</div>
        <div id="stage-decision-area-${interview.id}">${stageDecisionHtml}</div>
      </div>
    </div>
  `;
}

function renderFeedbackReadout(feedback, interviewId, isMine) {
  return `
    <div class="feedback-readout"><span>Technical Skills</span><span class="score-pill">${feedback.technicalSkills}</span></div>
    <div class="feedback-readout"><span>Communication</span><span class="score-pill">${feedback.communication}</span></div>
    <div class="feedback-readout"><span>Problem Solving</span><span class="score-pill">${feedback.problemSolving}</span></div>
    <div class="feedback-readout"><span>Cultural Fit</span><span class="score-pill">${feedback.culturalFit}</span></div>
    <div class="feedback-readout"><span>Overall Recommendation</span><span class="score-pill">${feedback.overallRecommendation}</span></div>
    <div class="mt-2">
      <div class="small text-muted">Comments</div>
      <div style="white-space: pre-wrap; font-size: 0.85rem;">${escapeHtml(feedback.comments)}</div>
    </div>
    <div class="small text-muted mt-2">Submitted by ${escapeHtml(feedback.submittedBy)} on ${formatDateTime(feedback.submittedAt)}</div>
    ${isMine ? `<button type="button" class="btn btn-outline-secondary btn-sm mt-2" data-edit-feedback="${interviewId}">Edit Feedback</button>` : ""}
  `;
}

function renderFeedbackFormPlaceholder(interviewId) {
  return `<button type="button" class="btn btn-login btn-sm mt-1" data-submit-feedback="${interviewId}">Submit Feedback</button>`;
}

document.addEventListener("click", (e) => {
  const submitBtn = e.target.closest("[data-submit-feedback]");
  const editBtn = e.target.closest("[data-edit-feedback]");
  if (submitBtn) showFeedbackForm(Number(submitBtn.dataset.submitFeedback), null);
  if (editBtn) loadAndShowFeedbackForm(Number(editBtn.dataset.editFeedback));
});

async function loadAndShowFeedbackForm(interviewId) {
  try {
    const response = await fetch(`${HM_API}/interviews/${interviewId}/feedback`, { headers: { ...getAuthHeader() } });
    const existing = response.ok ? await response.json() : null;
    showFeedbackForm(interviewId, existing);
  } catch (err) {
    showFeedbackForm(interviewId, null);
  }
}

function showFeedbackForm(interviewId, existing) {
  const area = document.getElementById(`feedback-area-${interviewId}-HIRING_MANAGER`);
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
    ${existing ? `<div class="alert alert-warning py-2 small">You already submitted feedback for this interview — saving will update your existing evaluation.</div>` : ""}
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
    area.innerHTML = existing ? renderFeedbackReadout(existing, interviewId, true) : renderFeedbackFormPlaceholder(interviewId);
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
      const response = await fetch(`${HM_API}/interviews/${interviewId}/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeader() },
        body: JSON.stringify({ ...values, comments }),
      });
      if (!response.ok) {
        const errors = await response.json();
        errorBox.textContent = Object.values(errors).join(" ") || "Please check the form and try again.";
        errorBox.classList.remove("d-none");
        return;
      }
      await loadData();
      const interview = myInterviews.find((i) => i.id === interviewId);
      if (interview) openCandidateModal(interview.candidateId);
    } catch (err) {
      errorBox.textContent = "Unable to reach the server. Please try again later.";
      errorBox.classList.remove("d-none");
    }
  });
}

async function makeDecision(candidateId, decision, comment) {
  try {
    const response = await fetch(`${HM_API}/candidates/${candidateId}/decision`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...getAuthHeader() },
      body: JSON.stringify({ decision, comment }),
    });
    if (!response.ok) {
      const errBody = await response.json().catch(() => ({}));
      alert(errBody.message || "Could not save this decision. Please try again.");
      return;
    }
    bootstrap.Modal.getInstance(document.getElementById("candidateModal"))?.hide();
    await loadData();
  } catch (err) {
    alert("Could not save this decision. Please try again.");
  }
}

if (guardHmAccess()) {
  loadData();
}
