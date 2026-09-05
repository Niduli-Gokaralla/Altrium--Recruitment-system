let allCandidates = [];

async function loadCandidates() {
  const loading = document.getElementById("candidatesLoading");
  const empty = document.getElementById("candidatesEmpty");
  const table = document.getElementById("candidatesTable");

  loading.classList.remove("d-none");
  try {
    const response = await fetch(`${HM_API}/candidates`, { headers: { ...getAuthHeader() } });
    if (!response.ok) throw new Error("Failed to load candidates");
    allCandidates = await response.json();
    populatePositionFilter();
    applyFilters();
  } catch (err) {
    empty.textContent = "Could not load candidates. Please refresh the page.";
    empty.classList.remove("d-none");
  } finally {
    loading.classList.add("d-none");
  }
}

function populatePositionFilter() {
  const select = document.getElementById("positionFilter");
  const positions = [...new Set(allCandidates.map((c) => c.jobOpeningTitle).filter(Boolean))].sort();
  select.innerHTML = '<option value="">All positions</option>' +
    positions.map((p) => `<option value="${escapeHtml(p)}">${escapeHtml(p)}</option>`).join("");
}

function applyFilters() {
  const search = document.getElementById("searchInput").value.trim().toLowerCase();
  const position = document.getElementById("positionFilter").value;
  const stage = document.getElementById("stageFilter").value;

  const filtered = allCandidates.filter((c) => {
    const matchesSearch = !search || c.fullName.toLowerCase().includes(search);
    const matchesPosition = !position || c.jobOpeningTitle === position;
    const matchesStage = !stage || c.stage === stage;
    return matchesSearch && matchesPosition && matchesStage;
  });
  renderTable(filtered);
}

document.getElementById("searchInput").addEventListener("input", applyFilters);
document.getElementById("positionFilter").addEventListener("change", applyFilters);
document.getElementById("stageFilter").addEventListener("change", applyFilters);
document.getElementById("clearFiltersBtn").addEventListener("click", () => {
  document.getElementById("searchInput").value = "";
  document.getElementById("positionFilter").value = "";
  document.getElementById("stageFilter").value = "";
  applyFilters();
});

function renderTable(candidates) {
  const empty = document.getElementById("candidatesEmpty");
  const table = document.getElementById("candidatesTable");
  const tbody = document.getElementById("candidatesTableBody");

  if (!candidates || candidates.length === 0) {
    empty.classList.remove("d-none");
    table.classList.add("d-none");
    return;
  }
  empty.classList.add("d-none");
  table.classList.remove("d-none");

  tbody.innerHTML = candidates.map((c) => {
    const cvCell = c.hasCv
      ? `<button type="button" class="cv-link btn btn-link p-0" data-action="view-cv" data-id="${c.id}"><i class="bi bi-file-earmark-text"></i> View CV</button>`
      : `<span class="no-cv">No CV</span>`;
    return `
      <tr>
        <td class="job-title-cell">${escapeHtml(c.fullName)}</td>
        <td>${escapeHtml(c.jobOpeningTitle)}</td>
        <td><span class="stage-pill ${stageBadgeClass(c.stage)}">${STAGE_LABELS[c.stage] || c.stage}</span></td>
        <td>${cvCell}</td>
        <td>${formatDateTime(c.createdAt)}</td>
        <td class="text-end"><button class="btn btn-sm btn-outline-secondary" data-action="view" data-id="${c.id}">View</button></td>
      </tr>
    `;
  }).join("");

  tbody.querySelectorAll('[data-action="view"]').forEach((btn) => {
    btn.addEventListener("click", () => openView(Number(btn.dataset.id)));
  });
  tbody.querySelectorAll('[data-action="view-cv"]').forEach((btn) => {
    btn.addEventListener("click", () => openCv(Number(btn.dataset.id)));
  });
}

async function openCv(id) {
  try {
    const response = await fetch(`http://localhost:8080/api/hiring-manager/candidates/${id}/cv`, { headers: { ...getAuthHeader() } });
    if (!response.ok) throw new Error("Could not load CV");
    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);
    window.open(blobUrl, "_blank");
    setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
  } catch (err) {
    alert("Could not open the CV. Please try again.");
  }
}

function openView(id) {
  const c = allCandidates.find((x) => x.id === id);
  if (!c) return;

  document.getElementById("viewTitle").textContent = c.fullName;
  const cvSection = c.hasCv
    ? `<button type="button" class="cv-link btn btn-link p-0" data-action="view-cv" data-id="${c.id}"><i class="bi bi-file-earmark-text"></i> ${escapeHtml(c.cvFileName)}</button>`
    : `<span class="no-cv">No CV uploaded</span>`;

  document.getElementById("viewBody").innerHTML = `
    <div class="details-section">
      <div class="details-meta-row"><span>Email</span><span>${escapeHtml(c.email)}</span></div>
      <div class="details-meta-row"><span>Phone</span><span>${escapeHtml(c.phone || "—")}</span></div>
      <div class="details-meta-row"><span>Applied Position</span><span>${escapeHtml(c.jobOpeningTitle)}</span></div>
      <div class="details-meta-row"><span>Applied Date</span><span>${formatDateTime(c.createdAt)}</span></div>
      <div class="details-meta-row"><span>Current Stage</span><span><span class="stage-pill ${stageBadgeClass(c.stage)}">${STAGE_LABELS[c.stage] || c.stage}</span></span></div>
      <div class="details-meta-row"><span>CV / Resume</span><span>${cvSection}</span></div>
    </div>
    <div class="details-section">
      <h6>Skills</h6>
      <p class="mb-0">${escapeHtml(c.skills) || "—"}</p>
    </div>
    <div class="details-section">
      <h6>Experience</h6>
      <p class="mb-0">${escapeHtml(c.experience) || "—"}</p>
    </div>
    <div class="details-section">
      <h6>Qualifications</h6>
      <p class="mb-0">${escapeHtml(c.qualifications) || "—"}</p>
    </div>
    <div class="text-end">
      <a href="hm-feedback.html" class="btn btn-login btn-sm px-3">Go to Feedback &amp; Decisions</a>
    </div>
  `;

  const cvBtn = document.querySelector('#viewBody [data-action="view-cv"]');
  if (cvBtn) cvBtn.addEventListener("click", () => openCv(c.id));

  new bootstrap.Modal(document.getElementById("candidateViewModal")).show();
}

if (guardHmAccess()) {
  loadCandidates();
}
