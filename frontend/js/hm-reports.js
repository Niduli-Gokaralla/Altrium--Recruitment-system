async function loadKpis() {
  const jobsLoading = document.getElementById("jobsLoading");
  const jobsEmpty = document.getElementById("jobsEmpty");
  const jobsTable = document.getElementById("jobsTable");

  jobsLoading.classList.remove("d-none");
  try {
    const response = await fetch(`${HM_API}/kpis`, { headers: { ...getAuthHeader() } });
    if (!response.ok) throw new Error("Failed to load KPIs");
    const data = await response.json();

    document.getElementById("kpiHireRate").textContent =
      data.hireRatePercent !== null && data.hireRatePercent !== undefined ? `${data.hireRatePercent}%` : "—";
    document.getElementById("kpiRejectionRate").textContent =
      data.rejectionRatePercent !== null && data.rejectionRatePercent !== undefined ? `${data.rejectionRatePercent}%` : "—";
    document.getElementById("kpiTimeToHire").textContent =
      data.averageTimeToHireDays !== null && data.averageTimeToHireDays !== undefined ? `${data.averageTimeToHireDays} days` : "No hires yet";

    if (!data.perJob || data.perJob.length === 0) {
      jobsEmpty.classList.remove("d-none");
      jobsTable.classList.add("d-none");
    } else {
      jobsEmpty.classList.add("d-none");
      jobsTable.classList.remove("d-none");
            document.getElementById("jobsTableBody").innerHTML = data.perJob.map((j) => {
        let scoreCell = `<span class="text-muted">—</span>`;
        if (j.averageScore != null) {
          const scoreClass = j.averageScore >= 80 ? "score-high" : j.averageScore >= 60 ? "score-mid" : "score-low";
          scoreCell = `<span class="report-score-pill ${scoreClass}">${j.averageScore.toFixed(0)}/100</span>`;
        }
        return `
          <tr>
            <td class="job-title-cell">${escapeHtml(j.jobTitle)}</td>
            <td>${j.candidateCount}</td>
            <td>${scoreCell}</td>
          </tr>
        `;
      }).join("");
    }
  } catch (err) {
    jobsEmpty.textContent = "Could not load recruitment reports. Please refresh the page.";
    jobsEmpty.classList.remove("d-none");
  } finally {
    jobsLoading.classList.add("d-none");
  }
}

if (guardHmAccess()) {
  loadKpis();
}
