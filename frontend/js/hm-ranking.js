let currentRanking = [];

async function loadJobFilter() {
  try {
    const response = await fetch(`${HM_API}/jobs`, { headers: { ...getAuthHeader() } });
    if (!response.ok) return;
    const jobs = await response.json();
    const select = document.getElementById("jobFilter");
    select.innerHTML = '<option value="">All my job openings</option>' +
      jobs.map((j) => `<option value="${j.id}">${escapeHtml(j.title)}</option>`).join("");
  } catch (err) {
    // Non-fatal — filter just stays "All"
  }
}

async function loadRanking() {
  const loading = document.getElementById("rankedLoading");
  const empty = document.getElementById("rankedEmpty");
  const table = document.getElementById("rankedTable");
  const incompleteCard = document.getElementById("incompleteCard");

  loading.classList.remove("d-none");
  empty.classList.add("d-none");
  table.classList.add("d-none");
  incompleteCard.style.display = "none";

  const jobId = document.getElementById("jobFilter").value;
  const url = jobId ? `${HM_API}/ranking?jobId=${jobId}` : `${HM_API}/ranking`;

  try {
    const response = await fetch(url, { headers: { ...getAuthHeader() } });
    if (!response.ok) throw new Error("Failed to load ranking");
    currentRanking = await response.json();
    renderRanking(currentRanking);
  } catch (err) {
    empty.textContent = "Could not load the ranking. Please refresh the page.";
    empty.classList.remove("d-none");
  } finally {
    loading.classList.add("d-none");
  }
}

document.getElementById("jobFilter").addEventListener("change", loadRanking);

function renderRanking(entries) {
  const empty = document.getElementById("rankedEmpty");
  const table = document.getElementById("rankedTable");
  const tbody = document.getElementById("rankedTableBody");
  const incompleteCard = document.getElementById("incompleteCard");
  const incompleteList = document.getElementById("incompleteList");

  const ranked = entries.filter((e) => e.totalScore !== null && e.totalScore !== undefined);
  const incomplete = entries.filter((e) => e.totalScore === null || e.totalScore === undefined);

  if (ranked.length === 0) {
    empty.classList.remove("d-none");
    table.classList.add("d-none");
  } else {
    empty.classList.add("d-none");
    table.classList.remove("d-none");
    tbody.innerHTML = ranked.map((e) => {
      const rankClass = e.rank <= 3 ? `rank-${e.rank}` : "";
      return `
        <tr>
          <td><span class="rank-badge ${rankClass}">${e.rank}</span></td>
          <td class="job-title-cell">${escapeHtml(e.candidateName)}</td>
          <td>${escapeHtml(e.jobTitle)}</td>
          <td>${STAGE_LABELS[e.stage] || e.stage}</td>
          <td><span class="score-pill" style="font-size:0.85rem;">${e.totalScore.toFixed(1)}/5</span></td>
          <td class="text-end"><button class="btn btn-sm btn-outline-secondary" data-id="${e.candidateId}">Details</button></td>
        </tr>
      `;
    }).join("");
    tbody.querySelectorAll("button[data-id]").forEach((btn) => {
      btn.addEventListener("click", () => openDetails(Number(btn.dataset.id)));
    });
  }

  if (incomplete.length > 0) {
    incompleteCard.style.display = "";
    incompleteList.innerHTML = incomplete.map((e) => `
      <li class="recent-item">
        <span class="name">${escapeHtml(e.candidateName)}</span> — ${escapeHtml(e.jobTitle)}
        <div class="meta">${STAGE_LABELS[e.stage] || e.stage}</div>
      </li>
    `).join("");
  } else {
    incompleteCard.style.display = "none";
  }
}

async function openDetails(candidateId) {
  const entry = currentRanking.find((e) => e.candidateId === candidateId);
  if (!entry) return;

  document.getElementById("detailsTitle").textContent = `${entry.candidateName} — Evaluation Breakdown`;
  document.getElementById("detailsBody").innerHTML = `<div class="text-muted small">Loading interview feedback...</div>`;
  new bootstrap.Modal(document.getElementById("detailsModal")).show();

  try {
    const interviewsRes = await fetch(`${HM_API}/interviews`, { headers: { ...getAuthHeader() } });
    const allInterviews = interviewsRes.ok ? await interviewsRes.json() : [];
    const candidateInterviews = allInterviews.filter((i) => i.candidateId === candidateId && i.hasFeedback);

    if (candidateInterviews.length === 0) {
      document.getElementById("detailsBody").innerHTML = `<div class="text-muted small">No feedback found for this candidate.</div>`;
      return;
    }

    const sections = await Promise.all(candidateInterviews.map(async (i) => {
      const fRes = await fetch(`${HM_API}/interviews/${i.id}/feedback`, { headers: { ...getAuthHeader() } });
      const f = fRes.ok ? await fRes.json() : null;
      if (!f) return "";
      return `
        <div class="details-section">
          <h6>${escapeHtml(i.stage)} — ${formatDate(i.interviewDate)}</h6>
          <div class="feedback-readout"><span>Technical Skills</span><span class="score-pill">${f.technicalSkills}</span></div>
          <div class="feedback-readout"><span>Communication</span><span class="score-pill">${f.communication}</span></div>
          <div class="feedback-readout"><span>Problem Solving</span><span class="score-pill">${f.problemSolving}</span></div>
          <div class="feedback-readout"><span>Cultural Fit</span><span class="score-pill">${f.culturalFit}</span></div>
          <div class="feedback-readout"><span>Overall Recommendation</span><span class="score-pill">${f.overallRecommendation}</span></div>
          <div class="mt-2 small text-muted">Comments: ${escapeHtml(f.comments)}</div>
        </div>
      `;
    }));

    document.getElementById("detailsBody").innerHTML = `
      <div class="mb-3"><strong>Total Score:</strong> ${entry.totalScore.toFixed(1)}/5 (averaged across all scored interviews)</div>
      ${sections.join("")}
    `;
  } catch (err) {
    document.getElementById("detailsBody").innerHTML = `<div class="text-danger small">Could not load evaluation details.</div>`;
  }
}

if (guardHmAccess()) {
  loadJobFilter();
  loadRanking();
}
