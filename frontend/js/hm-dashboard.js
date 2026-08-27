async function loadDashboard() {
  try {
    const response = await fetch(`${HM_API}/dashboard`, { headers: { ...getAuthHeader() } });
    if (!response.ok) throw new Error("Failed to load dashboard");
    const data = await response.json();

    document.getElementById("kpiJobs").textContent = data.myJobOpeningsCount;
    document.getElementById("kpiCandidates").textContent = data.candidatesCount;
    document.getElementById("kpiInterviews").textContent = data.interviewsCount;
    document.getElementById("kpiPending").textContent = data.pendingDecisionsCount;

    const strip = document.getElementById("pipelineStrip");
    const stages = Object.keys(data.pipeline);
    strip.innerHTML = stages.map((stage, idx) => `
      <div class="pipeline-stage">
        <div class="num">${data.pipeline[stage]}</div>
        <div class="label">${STAGE_LABELS[stage] || stage}</div>
      </div>
      ${idx < stages.length - 1 ? '<i class="bi bi-arrow-right pipeline-arrow"></i>' : ""}
    `).join("");

    const attentionEmpty = document.getElementById("attentionEmpty");
    const attentionList = document.getElementById("attentionList");
    if (!data.candidatesRequiringAttention || data.candidatesRequiringAttention.length === 0) {
      attentionEmpty.classList.remove("d-none");
    } else {
      attentionEmpty.classList.add("d-none");
      attentionList.innerHTML = data.candidatesRequiringAttention.map((a) => `
        <li class="attention-item">
          <div class="name">${escapeHtml(a.candidateName)}</div>
          <div class="meta">${escapeHtml(a.jobTitle)} · ${escapeHtml(a.reason)}</div>
        </li>
      `).join("");
    }

    const upcomingEmpty = document.getElementById("upcomingEmpty");
    const upcomingList = document.getElementById("upcomingList");
    if (!data.upcomingInterviews || data.upcomingInterviews.length === 0) {
      upcomingEmpty.classList.remove("d-none");
    } else {
      upcomingEmpty.classList.add("d-none");
      upcomingList.innerHTML = data.upcomingInterviews.map((i) => {
        const [month, day] = formatShortDate(i.interviewDate).split(" ");
        return `
        <li>
          <div class="interview-date"><span class="day-num">${day}</span>${month}</div>
          <div class="interview-info">
            <div class="title">${escapeHtml(i.candidateName)} — ${escapeHtml(i.stage)}</div>
            <div class="meta">${escapeHtml(i.jobTitle)} · ${formatTime(i.interviewTime)}</div>
          </div>
        </li>
      `;
      }).join("");
    }
  } catch (err) {
    const guardMessage = document.getElementById("guardMessage");
    guardMessage.textContent = "Could not load your dashboard. Please refresh the page.";
    guardMessage.classList.remove("d-none");
  }
}

if (guardHmAccess()) {
  loadDashboard();
}
