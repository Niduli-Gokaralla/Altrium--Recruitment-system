async function loadDashboard() {
  try {
    const response = await fetch(`${HM_API}/dashboard`, { headers: { ...getAuthHeader() } });
    if (!response.ok) throw new Error("Failed to load dashboard");
    const data = await response.json();

    document.getElementById("kpiJobs").textContent = data.myJobOpeningsCount;
    document.getElementById("kpiCandidates").textContent = data.candidatesCount;
    document.getElementById("kpiInterviews").textContent = data.interviewsCount;
    document.getElementById("kpiPending").textContent = data.pendingDecisionsCount;

    // Pipeline as a horizontal bar chart — bar width is proportional
    // to the largest stage count, so the biggest stage always fills
    // the row completely and the rest scale relative to it.
    const barsContainer = document.getElementById("pipelineBars");
    const stages = Object.keys(data.pipeline);
    const maxCount = Math.max(1, ...stages.map((s) => data.pipeline[s]));

    barsContainer.innerHTML = stages.map((stage) => {
      const count = data.pipeline[stage];
      const widthPercent = Math.round((count / maxCount) * 100);
      return `
        <div class="pipeline-bar-row">
          <div class="pipeline-bar-label">${STAGE_LABELS[stage] || stage}</div>
          <div class="pipeline-bar-track">
            <div class="pipeline-bar-fill" style="width: ${widthPercent}%;"></div>
          </div>
          <div class="pipeline-bar-count">${count}</div>
        </div>
      `;
    }).join("");

    const attentionEmpty = document.getElementById("attentionEmpty");
    const attentionList = document.getElementById("attentionList");
    if (!data.candidatesRequiringAttention || data.candidatesRequiringAttention.length === 0) {
      attentionEmpty.classList.remove("d-none");
    } else {
      attentionEmpty.classList.add("d-none");
      attentionList.innerHTML = data.candidatesRequiringAttention.map((a) => `
        <li class="attention-item-dark">
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
      upcomingList.innerHTML = data.upcomingInterviews.map((i) => `
        <li class="attention-item-dark">
          <div class="name">${escapeHtml(i.candidateName)}</div>
          <div class="meta">${escapeHtml(i.jobTitle)} · ${formatShortDate(i.interviewDate)}, ${formatTime(i.interviewTime)}</div>
        </li>
      `).join("");
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