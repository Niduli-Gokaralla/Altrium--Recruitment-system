async function loadDashboard() {
  try {
    const response = await fetch(`${INT_API}/dashboard`, { headers: { ...getAuthHeader() } });
    if (!response.ok) throw new Error("Failed to load dashboard");
    const data = await response.json();

    document.getElementById("kpiInterviews").textContent = data.assignedInterviewsCount;
    document.getElementById("kpiCandidates").textContent = data.candidatesCount;
    document.getElementById("kpiPending").textContent = data.pendingFeedbackCount;

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
            <div class="meta">${escapeHtml(i.jobOpeningTitle)} · ${formatTime(i.interviewTime)}</div>
          </div>
        </li>
      `;
      }).join("");
    }

    const pendingEmpty = document.getElementById("pendingEmpty");
    const pendingList = document.getElementById("pendingList");
    if (!data.pendingFeedback || data.pendingFeedback.length === 0) {
      pendingEmpty.classList.remove("d-none");
    } else {
      pendingEmpty.classList.add("d-none");
      pendingList.innerHTML = data.pendingFeedback.map((p) => `
        <li class="attention-item">
          <div class="name">${escapeHtml(p.candidateName)}</div>
          <div class="meta">${escapeHtml(p.jobOpeningTitle)} · ${escapeHtml(p.stage)} · ${formatDate(p.interviewDate)}</div>
        </li>
      `).join("");
    }
  } catch (err) {
    const guardMessage = document.getElementById("guardMessage");
    guardMessage.textContent = "Could not load your dashboard. Please refresh the page.";
    guardMessage.classList.remove("d-none");
  }
}

if (guardIntAccess()) {
  loadDashboard();
}
