const API_BASE_URL = "http://localhost:8080/api/hr/jobs";

const guardMessage = document.getElementById("guardMessage");
const dashboardContent = document.getElementById("dashboardContent");
const welcomeUser = document.getElementById("welcomeUser");
const logoutBtn = document.getElementById("logoutBtn");

function getAuthHeader() {
  const token = sessionStorage.getItem("authToken");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// AC-9 (client-side guard): only proceed if a token + HR role are present.
// The real enforcement lives server-side in SecurityConfig/JwtAuthenticationFilter —
// this just avoids showing HR UI to someone who clearly isn't logged in as HR.
function guardHrAccess() {
  const token = sessionStorage.getItem("authToken");
  const role = sessionStorage.getItem("role");
  const username = sessionStorage.getItem("username");

  if (!token || role !== "HR") {
    guardMessage.textContent = "You must be logged in as an HR user to view this page.";
    guardMessage.classList.remove("d-none");
    return false;
  }

  welcomeUser.textContent = `Signed in as ${username} (HR)`;

  const initial = username ? username.charAt(0).toUpperCase() : "H";
  const sidebarAvatar = document.getElementById("sidebarAvatar");
  const headerAvatar = document.getElementById("headerAvatar");
  const sidebarUsername = document.getElementById("sidebarUsername");
  const welcomeName = document.getElementById("welcomeName");
  if (sidebarAvatar) sidebarAvatar.textContent = initial;
  if (headerAvatar) headerAvatar.textContent = initial;
  if (sidebarUsername) sidebarUsername.textContent = username;
  if (welcomeName) welcomeName.textContent = username;

  dashboardContent.classList.remove("d-none");
  return true;
}

logoutBtn.addEventListener("click", () => {
  sessionStorage.clear();
  window.location.href = "login.html";
});

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

// Live: pulls the real job opening count for the KPI card.
// Full management (create/edit/delete/search/filter) lives on job-openings.html.
async function loadJobCount() {
  const jobCountValue = document.getElementById("jobCountValue");
  try {
    const response = await fetch(API_BASE_URL, { headers: { ...getAuthHeader() } });
    if (!response.ok) throw new Error("Failed to load job openings");
    const jobs = await response.json();
    if (jobCountValue) jobCountValue.textContent = jobs.length;
  } catch (err) {
    if (jobCountValue) jobCountValue.textContent = "–";
  }
}

if (guardHrAccess()) {
  loadJobCount();
  renderSamplePipeline();
  renderSampleInterviews();
  renderSampleSourcesChart();
}

// ---------------------------------------------------------------------
// Sample/placeholder data below — for layout purposes only, per user
// request. Not backed by real applicant/interview/candidate tracking.
// ---------------------------------------------------------------------

function renderSamplePipeline() {
  // Stages: Applying, Screening, Interview, Tech Interview, HR Interview, Assessment, Offer, Onboarding
  const pipelineData = [
    { title: "Art Director", meta: "Full-time · Remote", stages: [41, 35, 20, 8, 5, 3, 1, null] },
    { title: "Senior PM", meta: "Full-time · Office", stages: [87, 50, 12, 9, 6, 3, null, null] },
    { title: "Java Developer", meta: "Full-time · Office", stages: [76, 55, 8, 4, 3, 2, 1, 1] },
    { title: "Sales Manager", meta: "Full-time · Office/Hybrid", stages: [98, 64, 18, 7, 4, 2, null, null] },
    { title: "UI Designer", meta: "Part-time · Remote", stages: [128, 43, 6, null, null, null, null, null] },
    { title: "HR Specialist", meta: "Part-time · Remote", stages: [110, 52, 11, 6, 3, 2, 1, 1] },
  ];

  const body = document.getElementById("pipelineBody");
  body.innerHTML = "";

  pipelineData.forEach((row) => {
    const tr = document.createElement("tr");
    const stageCells = row.stages.map((val, idx) => {
      if (val === null) return `<td></td>`;
      let pillClass = "pipeline-pill";
      if (idx === 2 || idx === 3 || idx === 4) pillClass += " stage-active";
      if (idx === 6 || idx === 7) pillClass += " stage-offer";
      return `<td><span class="${pillClass}">${val}</span></td>`;
    }).join("");

    tr.innerHTML = `
      <td>
        <div class="job-name">${escapeHtml(row.title)}</div>
        <div class="job-meta">${escapeHtml(row.meta)}</div>
      </td>
      ${stageCells}
    `;
    body.appendChild(tr);
  });
}

function renderSampleInterviews() {
  const interviews = [
    { day: "4", month: "Feb", title: "Tech interview", meta: "14:00–15:30 · Adam Johnson" },
    { day: "4", month: "Feb", title: "First interview", meta: "12:00–13:00 · Janet Parker" },
    { day: "5", month: "Feb", title: "Retrospective January", meta: "09:00–10:00 · Roy Rodriguez" },
    { day: "7", month: "Feb", title: "Tech interview", meta: "11:00–12:15 · Arnold Hernandez" },
    { day: "8", month: "Feb", title: "New employee interview", meta: "10:00–11:00 · Cheryl McCormick" },
  ];

  const list = document.getElementById("interviewsList");
  list.innerHTML = "";

  interviews.forEach((item) => {
    const li = document.createElement("li");
    li.innerHTML = `
      <div class="interview-date">
        <span class="day-num">${item.day}</span>${item.month}
      </div>
      <div class="interview-info">
        <div class="title">${escapeHtml(item.title)}</div>
        <div class="meta">${escapeHtml(item.meta)}</div>
      </div>
    `;
    list.appendChild(li);
  });
}

function renderSampleSourcesChart() {
  const canvas = document.getElementById("sourcesChart");
  if (!canvas || typeof Chart === "undefined") return;

  new Chart(canvas, {
    type: "doughnut",
    data: {
      labels: ["Job boards", "Socials", "Referrals", "Others"],
      datasets: [{
        data: [180, 120, 90, 28],
        backgroundColor: ["#16324f", "#e4f27a", "#f6b93b", "#6fa8dc"],
        borderWidth: 0,
      }],
    },
    options: {
      cutout: "70%",
      plugins: {
        legend: {
          position: "bottom",
          labels: { boxWidth: 10, font: { size: 10 } },
        },
      },
    },
  });
}
