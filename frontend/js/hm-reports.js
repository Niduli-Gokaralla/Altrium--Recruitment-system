async function loadKpis() {
  const jobsLoading = document.getElementById("jobsLoading");
  const jobsEmpty = document.getElementById("jobsEmpty");
  const jobsTable = document.getElementById("jobsTable");

  jobsLoading.classList.remove("d-none");
  try {
    const response = await fetch(`${HM_API}/kpis`, { headers: { ...getAuthHeader() } });
    if (!response.ok) throw new Error("Failed to load KPIs");
    const data = await response.json();

    document.getElementById("kpiTotalJobs").textContent = data.totalJobOpenings;
    document.getElementById("kpiTotalCandidates").textContent = data.totalCandidates;
    document.getElementById("kpiHired").textContent = data.hiredCount;
    document.getElementById("kpiRejected").textContent = data.rejectedCount;

    const strip = document.getElementById("pipelineStrip");
    const stages = Object.keys(data.stageCounts);
    strip.innerHTML = stages.map((stage, idx) => `
      <div class="pipeline-stage">
        <div class="num">${data.stageCounts[stage]}</div>
        <div class="label">${STAGE_LABELS[stage] || stage}</div>
      </div>
      ${idx < stages.length - 1 ? '<i class="bi bi-arrow-right pipeline-arrow"></i>' : ""}
    `).join("");

    if (!data.perJob || data.perJob.length === 0) {
      jobsEmpty.classList.remove("d-none");
      jobsTable.classList.add("d-none");
    } else {
      jobsEmpty.classList.add("d-none");
      jobsTable.classList.remove("d-none");
      document.getElementById("jobsTableBody").innerHTML = data.perJob.map((j) => `
        <tr>
          <td class="job-title-cell">${escapeHtml(j.jobTitle)}</td>
          <td>${j.candidateCount}</td>
          <td>${j.averageScore != null ? j.averageScore.toFixed(1) + "/5" : "—"}</td>
        </tr>
      `).join("");
    }
  } catch (err) {
    jobsEmpty.textContent = "Could not load recruitment KPIs. Please refresh the page.";
    jobsEmpty.classList.remove("d-none");
  } finally {
    jobsLoading.classList.add("d-none");
  }
}

if (guardHmAccess()) {
  loadKpis();
}
