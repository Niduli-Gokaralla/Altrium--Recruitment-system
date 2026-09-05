let myCandidates = [];

async function loadCandidates() {
  const loading = document.getElementById("candidatesLoading");
  const empty = document.getElementById("candidatesEmpty");
  const table = document.getElementById("candidatesTable");

  loading.classList.remove("d-none");
  try {
    const response = await fetch(`${INT_API}/candidates`, { headers: { ...getAuthHeader() } });
    if (!response.ok) throw new Error("Failed to load candidates");
    myCandidates = await response.json();
    renderTable(myCandidates);
  } catch (err) {
    empty.textContent = "Could not load your candidates. Please refresh the page.";
    empty.classList.remove("d-none");
  } finally {
    loading.classList.add("d-none");
  }
}

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
        <td><span class="stage-pill stage-${c.stage.toLowerCase()}">${STAGE_LABELS[c.stage] || c.stage}</span></td>
        <td>${cvCell}</td>
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

// A plain <a href> can't carry the Authorization header, so fetch the CV
// with the token and open it as a blob instead.
async function openCv(id) {
  try {
    const response = await fetch(`${INT_API}/candidates/${id}/cv`, { headers: { ...getAuthHeader() } });
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
  const c = myCandidates.find((x) => x.id === id);
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
      <div class="details-meta-row"><span>Current Stage</span><span><span class="stage-pill stage-${c.stage.toLowerCase()}">${STAGE_LABELS[c.stage] || c.stage}</span></span></div>
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
  `;

  const cvBtn = document.querySelector('#viewBody [data-action="view-cv"]');
  if (cvBtn) cvBtn.addEventListener("click", () => openCv(c.id));

  new bootstrap.Modal(document.getElementById("candidateViewModal")).show();
}

if (guardIntAccess()) {
  loadCandidates();
}
