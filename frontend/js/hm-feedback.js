let myCandidates = [];
let myInterviews = [];

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

    // US-16/US-37: candidates who've reached the Interview stage are the
    // ones a Hiring Manager needs to review and decide on.
    myCandidates = allCandidates.filter((c) => c.stage === "INTERVIEW");

    renderList();
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

function candidateHasFeedback(candidateId) {
  return candidateInterviews(candidateId).some((i) => i.hasFeedback);
}

function renderList() {
  const empty = document.getElementById("candidatesEmpty");
  const list = document.getElementById("candidatesList");

  if (!myCandidates || myCandidates.length === 0) {
    empty.classList.remove("d-none");
    list.innerHTML = "";
    return;
  }
  empty.classList.add("d-none");

  list.innerHTML = myCandidates.map((c) => {
    const interviews = candidateInterviews(c.id);
    const hasFeedback = candidateHasFeedback(c.id);
    return `
      <div class="decision-card">
        <div>
          <div class="name">${escapeHtml(c.fullName)}</div>
          <div class="meta">${escapeHtml(c.jobOpeningTitle)} · ${interviews.length} interview(s) · ${hasFeedback ? "Feedback submitted" : "No feedback yet"}</div>
        </div>
        <button class="btn btn-login btn-sm px-3" data-id="${c.id}">Review</button>
      </div>
    `;
  }).join("");

  list.querySelectorAll("button[data-id]").forEach((btn) => {
    btn.addEventListener("click", () => openCandidateModal(Number(btn.dataset.id)));
  });
}

async function openCandidateModal(candidateId) {
  const c = myCandidates.find((x) => x.id === candidateId);
  if (!c) return;
  const interviews = candidateInterviews(candidateId);

  document.getElementById("candidateModalTitle").textContent = `${c.fullName} — ${c.jobOpeningTitle}`;

  const interviewSections = await Promise.all(interviews.map((i) => renderInterviewSection(i)));

  const hasFeedback = candidateHasFeedback(candidateId);

  document.getElementById("candidateModalBody").innerHTML = `
    ${interviewSections.join("")}
    <h6 class="section-heading">Decision</h6>
    ${hasFeedback ? `
      <div class="d-flex gap-2">
        <button class="btn btn-outline-success btn-sm" id="moveNextBtn">Move to Next Stage</button>
        <button class="btn btn-outline-danger btn-sm" id="rejectBtn">Reject</button>
      </div>
    ` : `
      <div class="text-muted small">At least one interview needs feedback submitted before a decision can be made.</div>
    `}
    <div id="decisionMessage" class="alert alert-success mt-3 d-none py-2 small"></div>
  `;

  if (hasFeedback) {
    document.getElementById("moveNextBtn").addEventListener("click", () => makeDecision(candidateId, "HIRED"));
    document.getElementById("rejectBtn").addEventListener("click", () => makeDecision(candidateId, "REJECTED"));
  }

  new bootstrap.Modal(document.getElementById("candidateModal")).show();
}

async function renderInterviewSection(interview) {
  let feedback = null;
  if (interview.hasFeedback) {
    try {
      const response = await fetch(`${HM_API}/interviews/${interview.id}/feedback`, { headers: { ...getAuthHeader() } });
      if (response.ok) feedback = await response.json();
    } catch (err) {
      // fall through — treat as no feedback loaded
    }
  }

  const readoutOrForm = feedback
    ? renderFeedbackReadout(feedback, interview.id)
    : renderFeedbackFormPlaceholder(interview.id);

  return `
    <div class="details-section">
      <h6 class="section-heading" style="margin-top:0;">${escapeHtml(interview.stage)} — ${formatDate(interview.interviewDate)}, ${formatTime(interview.interviewTime)}</h6>
      <div class="details-meta-row"><span>Interviewer</span><span>${escapeHtml(interview.interviewer)}</span></div>
      <div id="feedback-area-${interview.id}">${readoutOrForm}</div>
    </div>
  `;
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

function renderFeedbackFormPlaceholder(interviewId) {
  return `<button type="button" class="btn btn-login btn-sm mt-1" data-submit-feedback="${interviewId}">Submit Feedback</button>`;
}

// Delegate clicks for the dynamically-rendered buttons inside the modal
document.getElementById("candidateModalBody")?.addEventListener("click", handleModalClick);
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
  const area = document.getElementById(`feedback-area-${interviewId}`);
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
    area.innerHTML = existing ? renderFeedbackReadout(existing, interviewId) : renderFeedbackFormPlaceholder(interviewId);
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
      // Refresh underlying data so the interview's hasFeedback flag is
      // current, then reopen the candidate modal fresh.
      await loadData();
      const interview = myInterviews.find((i) => i.id === interviewId);
      if (interview) openCandidateModal(interview.candidateId);
    } catch (err) {
      errorBox.textContent = "Unable to reach the server. Please try again later.";
      errorBox.classList.remove("d-none");
    }
  });
}

function handleModalClick() {
  // Reserved for future direct handlers if needed; buttons are wired via
  // the document-level delegate above plus per-render addEventListener calls.
}

async function makeDecision(candidateId, decision) {
  const label = decision === "HIRED" ? "move this candidate to the next stage" : "reject this candidate";
  if (!confirm(`Are you sure you want to ${label}?`)) return;

  try {
    const response = await fetch(`${HM_API}/candidates/${candidateId}/decision`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...getAuthHeader() },
      body: JSON.stringify({ decision }),
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
