const CANDIDATES_API = "http://localhost:8080/api/hr/candidates";
const JOBS_API = "http://localhost:8080/api/hr/jobs";
const INTERVIEWS_API = "http://localhost:8080/api/interviews";

const guardMessage = document.getElementById("guardMessage");
const dashboardContent = document.getElementById("dashboardContent");

function getAuthHeader() {
  const token = sessionStorage.getItem("authToken");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function guardHrAccess() {
  const token = sessionStorage.getItem("authToken");
  const role = sessionStorage.getItem("role");
  const username = sessionStorage.getItem("username");

  if (!token || role !== "HR") {
    guardMessage.textContent = "You must be logged in as an HR user to view this page.";
    guardMessage.classList.remove("d-none");
    return false;
  }

  const welcomeName = document.getElementById("welcomeName");
  if (welcomeName && username) {
    const displayName = username.replace(/^hr_/i, "");
    welcomeName.textContent = displayName.charAt(0).toUpperCase() + displayName.slice(1);
  }

  dashboardContent.classList.remove("d-none");
  return true;
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str || "";
  return div.innerHTML;
}

function formatDate(value) {
  if (!value) return "";
  const d = new Date(value + "T00:00:00");
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function formatTime(value) {
  if (!value) return "";
  const [h, m] = value.split(":");
  const d = new Date();
  d.setHours(Number(h), Number(m));
  return d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

const STAGE_LABELS = {
  APPLIED: "Applied",
  SCREENING: "Screening",
  SHORTLISTED: "Shortlisted",
  NOT_SHORTLISTED: "Not Shortlisted",
  INTERVIEW: "Interview",
  HIRED: "Hired",
  REJECTED: "Rejected",
};

const STAGE_COLORS = {
  APPLIED: "#9fb3c8",
  SCREENING: "#f6b93b",
  SHORTLISTED: "#4a90d9",
  NOT_SHORTLISTED: "#c0392b",
  INTERVIEW: "#16324f",
  HIRED: "#1e9e5a",
  REJECTED: "#8a8a8a",
};

async function loadDashboard() {
  try {
    const [candidatesRes, jobsRes, interviewsRes] = await Promise.all([
      fetch(CANDIDATES_API, { headers: { ...getAuthHeader() } }),
      fetch(JOBS_API, { headers: { ...getAuthHeader() } }),
      fetch(INTERVIEWS_API, { headers: { ...getAuthHeader() } }),
    ]);

    if (!candidatesRes.ok || !jobsRes.ok || !interviewsRes.ok) {
      throw new Error("Failed to load dashboard data");
    }

    const candidates = await candidatesRes.json();
    const jobs = await jobsRes.json();
    const interviews = await interviewsRes.json();

    renderKpis(candidates, jobs);
    renderPipeline(candidates, jobs);
    renderStageChart(candidates);
    renderUpcomingInterviews(interviews);
  } catch (err) {
    guardMessage.textContent = "Could not load your dashboard. Please refresh the page.";
    guardMessage.classList.remove("d-none");
    dashboardContent.classList.add("d-none");
  }
}

// --- KPI cards: every number here comes directly from real records,
// no sample/placeholder data or fabricated deltas. ---
function renderKpis(candidates, jobs) {
  document.getElementById("kpiTotalApplicants").textContent = candidates.length;

    const interviewedCount = candidates.filter((c) =>
    ["HR Interview", "Technical Interview", "Final Interview", "HIRED", "REJECTED"].includes(c.stage)
  ).length;
  document.getElementById("kpiInterviewed").textContent = interviewedCount;

  document.getElementById("kpiJobOpenings").textContent = jobs.length;

  const hiredCount = candidates.filter((c) => c.stage === "HIRED").length;
  document.getElementById("kpiHired").textContent = hiredCount;
}

// --- Hiring pipeline: real candidate counts per job opening per stage. ---
function renderPipeline(candidates, jobs) {
  const tbody = document.getElementById("pipelineTableBody");
  const empty = document.getElementById("pipelineEmpty");

  if (!jobs.length || !candidates.length) {
    tbody.innerHTML = "";
    empty.classList.remove("d-none");
    return;
  }
  empty.classList.add("d-none");

  const pipelineStages = ["APPLIED", "SCREENING", "SHORTLISTED", "INTERVIEW", "HIRED", "REJECTED"];

  tbody.innerHTML = jobs.map((job) => {
    const jobCandidates = candidates.filter((c) => c.jobOpeningId === job.id);
    const counts = pipelineStages.map((stage) => jobCandidates.filter((c) => c.stage === stage).length);
    return `
      <tr>
        <td class="job-name">${escapeHtml(job.title)}<div class="job-meta">${escapeHtml(job.department)}</div></td>
        ${counts.map((n) => `<td class="text-center"><span class="pipeline-pill ${n > 0 ? "stage-active" : ""}">${n}</span></td>`).join("")}
      </tr>
    `;
  }).join("");
}

// --- Candidates by stage: real distribution across ALL candidates,
// rendered as a doughnut chart. Replaces the old "candidate sources"
// chart, since source isn't tracked anywhere in this system. ---
let stageChartInstance = null;

function renderStageChart(candidates) {
  const canvas = document.getElementById("stageChart");
  const empty = document.getElementById("stageChartEmpty");

  if (!candidates.length) {
    canvas.classList.add("d-none");
    empty.classList.remove("d-none");
    return;
  }
  canvas.classList.remove("d-none");
  empty.classList.add("d-none");

  const stageCounts = {};
  candidates.forEach((c) => {
    stageCounts[c.stage] = (stageCounts[c.stage] || 0) + 1;
  });

  const labels = Object.keys(stageCounts).map((s) => STAGE_LABELS[s] || s);
  const data = Object.values(stageCounts);
  const colors = Object.keys(stageCounts).map((s) => STAGE_COLORS[s] || "#ccc");

  if (stageChartInstance) stageChartInstance.destroy();
  stageChartInstance = new Chart(canvas, {
    type: "doughnut",
    data: {
      labels,
      datasets: [{ data, backgroundColor: colors, borderWidth: 0 }],
    },
    options: {
      plugins: { legend: { position: "bottom", labels: { boxWidth: 12, font: { size: 11 } } } },
      cutout: "65%",
    },
  });
}

// --- Upcoming interviews: real scheduled interviews, soonest first. ---
function renderUpcomingInterviews(interviews) {
  const empty = document.getElementById("upcomingEmpty");
  const list = document.getElementById("upcomingList");

  const today = new Date().toISOString().split("T")[0];
  const upcoming = interviews
    .filter((i) => i.status === "SCHEDULED" && i.interviewDate >= today)
    .sort((a, b) => (a.interviewDate + a.interviewTime).localeCompare(b.interviewDate + b.interviewTime))
    .slice(0, 6);

  if (!upcoming.length) {
    empty.classList.remove("d-none");
    list.innerHTML = "";
    return;
  }
  empty.classList.add("d-none");

  list.innerHTML = upcoming.map((i) => {
    const [month, day] = formatDate(i.interviewDate).split(" ");
    return `
      <li>
        <div class="interview-date"><span class="day-num">${day}</span>${month}</div>
        <div class="interview-info">
          <div class="title">${escapeHtml(i.candidateName)} — ${escapeHtml(i.stage)}</div>
          <div class="meta">${escapeHtml(i.jobOpeningTitle)} · ${formatTime(i.interviewTime)} · Interviewer: ${escapeHtml(i.interviewer)}</div>
        </div>
      </li>
    `;
  }).join("");
}

if (guardHrAccess()) {
  loadDashboard();
}
