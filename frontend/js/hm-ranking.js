const STAGE_RANKING_API = `${HM_API}/stage-ranking`;
const STAGE_DECISION_API = `${HM_API}/interviews`;

let currentRanking = [];

async function loadJobFilter() {
  try {
    const response = await fetch(`${HM_API}/jobs`, { headers: { ...getAuthHeader() } });
    if (!response.ok) return;
    const jobs = await response.json();
    const select = document.getElementById("jobFilter");
    select.innerHTML = '<option value="">Select a job opening...</option>' +
      jobs.map((j) => `<option value="${j.id}">${escapeHtml(j.title)}</option>`).join("");
  } catch (err) {
    // Non-fatal — dropdown just stays empty
  }
}

function checkSelectionsAndLoad() {
  const jobId = document.getElementById("jobFilter").value;
  const stage = document.getElementById("stageSelect").value;

  if (!jobId) {
    document.getElementById("stageSelect").disabled = true;
    document.getElementById("stageSelect").value = "";
  } else {
    document.getElementById("stageSelect").disabled = false;
  }

  if (!jobId || !stage) {
    document.getElementById("noSelectionMessage").classList.remove("d-none");
    document.getElementById("rankingContent").classList.add("d-none");
    return;
  }

  document.getElementById("noSelectionMessage").classList.add("d-none");
  document.getElementById("rankingContent").classList.remove("d-none");
  loadStageRanking(jobId, stage);
}

document.getElementById("jobFilter").addEventListener("change", checkSelectionsAndLoad);
document.getElementById("stageSelect").addEventListener("change", checkSelectionsAndLoad);
document.getElementById("clearFiltersBtn").addEventListener("click", () => {
  document.getElementById("jobFilter").value = "";
  document.getElementById("stageSelect").value = "";
  document.getElementById("stageSelect").disabled = true;
  checkSelectionsAndLoad();
});

async function loadStageRanking(jobId, stage) {
  const empty = document.getElementById("rankedEmpty");
  const table = document.getElementById("rankedTable");
  empty.classList.add("d-none");
  table.classList.add("d-none");

  document.getElementById("stageSummaryTitle").textContent = stage;

  try {
    const response = await fetch(`${STAGE_RANKING_API}?jobId=${jobId}&stage=${encodeURIComponent(stage)}`, { headers: { ...getAuthHeader() } });
    if (!response.ok) throw new Error("Failed to load ranking");
    currentRanking = await response.json();
    renderAll();
  } catch (err) {
    empty.textContent = "Could not load the ranking. Please refresh the page.";
    empty.classList.remove("d-none");
  }
}

function renderAll() {
  const ranked = currentRanking.filter((r) => r.hasAllScores);
  const incomplete = currentRanking.filter((r) => !r.hasAllScores);

  document.getElementById("candidatesEvaluatedCount").textContent = currentRanking.length;

  renderStageWinner(ranked);
  renderTable(ranked);
  renderIncomplete(incomplete);
}

function renderStageWinner(ranked) {
  const block = document.getElementById("stageWinnerBlock");
  if (ranked.length === 0) {
    block.classList.add("d-none");
    return;
  }
  const winner = ranked[0];
  block.classList.remove("d-none");
  document.getElementById("stageWinnerName").textContent = winner.candidateName;
  document.getElementById("stageWinnerScore").textContent = `${winner.stageScore.toFixed(1)} / 100`;
}

function scoreCellHtml(value) {
  if (value === null || value === undefined) return `<span class="text-muted small">—</span>`;
  return value.toFixed(1);
}

function renderTable(ranked) {
  const empty = document.getElementById("rankedEmpty");
  const table = document.getElementById("rankedTable");
  const tbody = document.getElementById("rankedTableBody");

  if (ranked.length === 0) {
    empty.classList.remove("d-none");
    table.classList.add("d-none");
    return;
  }
  empty.classList.add("d-none");
  table.classList.remove("d-none");

  tbody.innerHTML = ranked.map((r) => {
    const isWinner = r.rank === 1;
    const rowClass = isWinner ? "stage-winner-row" : "";
    const rankBadge = isWinner ? `🥇 #${r.rank}` : `#${r.rank}`;

    // AC: only the #1 candidate gets the Advance action — ranking is
    // decision support, not an automatic hire. The Hiring Manager must
    // explicitly confirm.
    const actionCell = isWinner
      ? `<button type="button" class="btn btn-login btn-sm px-3" data-action="advance" data-interview-id="${r.interviewId}" data-candidate-name="${escapeHtml(r.candidateName)}">Advance to Next Stage</button>`
      : `<span class="text-muted small">—</span>`;

    return `
      <tr class="${rowClass}">
        <td><strong>${rankBadge}</strong></td>
        <td class="job-title-cell">${escapeHtml(r.candidateName)}</td>
        <td>${scoreCellHtml(r.interviewerScore)}</td>
        <td>${scoreCellHtml(r.hrScore)}</td>
        <td>${scoreCellHtml(r.hiringManagerScore)}</td>
        <td><strong>${r.stageScore.toFixed(1)}</strong> / 100</td>
        <td>${STAGE_LABELS[r.candidateStatus] || escapeHtml(r.candidateStatus)}</td>
        <td class="text-end" id="action-cell-${r.candidateId}">${actionCell}</td>
      </tr>
    `;
  }).join("");

  tbody.querySelectorAll('[data-action="advance"]').forEach((btn) => {
    btn.addEventListener("click", () => showAdvanceConfirmation(
      Number(btn.dataset.interviewId), btn.dataset.candidateName, btn.closest("td").id
    ));
  });
}

// AC: the system never auto-advances anyone — this is an explicit,
// confirmable action with an optional comment, same pattern as the
// stage decisions on Feedback & Decisions.
function showAdvanceConfirmation(interviewId, candidateName, cellId) {
  const cell = document.getElementById(cellId);
  cell.innerHTML = `
    <div class="text-start" style="min-width:220px;">
      <div class="alert alert-warning py-2 small mb-2">Advance ${escapeHtml(candidateName)} to the next stage?</div>
      <textarea class="form-control form-control-sm mb-2" id="advanceComment-${interviewId}" rows="2" placeholder="Optional comment..."></textarea>
      <div class="d-flex gap-2 justify-content-end">
        <button type="button" class="btn btn-outline-secondary btn-sm" id="cancelAdvance-${interviewId}">Cancel</button>
        <button type="button" class="btn btn-login btn-sm" id="confirmAdvance-${interviewId}">Confirm</button>
      </div>
    </div>
  `;

  document.getElementById(`cancelAdvance-${interviewId}`).addEventListener("click", () => {
    renderTable(currentRanking.filter((r) => r.hasAllScores));
  });

  document.getElementById(`confirmAdvance-${interviewId}`).addEventListener("click", async () => {
    const comment = document.getElementById(`advanceComment-${interviewId}`).value.trim();
    try {
      const response = await fetch(`${STAGE_DECISION_API}/${interviewId}/stage-decision`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeader() },
        body: JSON.stringify({ decision: "ADVANCE", comment }),
      });
      if (!response.ok) {
        const errBody = await response.json().catch(() => ({}));
        alert(errBody.message || "Could not advance this candidate. Please try again.");
        return;
      }
      const jobId = document.getElementById("jobFilter").value;
      const stage = document.getElementById("stageSelect").value;
      await loadStageRanking(jobId, stage);
    } catch (err) {
      alert("Could not advance this candidate. Please try again.");
    }
  });
}

function renderIncomplete(incomplete) {
  const card = document.getElementById("incompleteCard");
  const list = document.getElementById("incompleteList");
  if (incomplete.length === 0) {
    card.style.display = "none";
    return;
  }
  card.style.display = "";
  list.innerHTML = incomplete.map((r) => {
    const missing = [];
    if (r.interviewerScore === null) missing.push("Interviewer");
    if (r.hrScore === null) missing.push("HR");
    if (r.hiringManagerScore === null) missing.push("Hiring Manager");
    const missingText = r.interviewId ? `Missing: ${missing.join(", ")}` : "No interview scheduled at this stage yet";
    return `
      <li class="recent-item">
        <span class="name">${escapeHtml(r.candidateName)}</span>
        <div class="meta">${missingText}</div>
      </li>
    `;
  }).join("");
}

if (guardHmAccess()) {
  loadJobFilter();
}
