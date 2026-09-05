# Altrium Recruitment System — README

Full-stack recruitment tracker: HTML/CSS/JS/Bootstrap frontend, Java Spring
Boot backend, MySQL database. Three roles — HR, Hiring Manager, Interviewer
— each with their own login, dashboard, and permissions.

## What's included

- `backend/` — Spring Boot 3 REST API (Java 17)
- `frontend/` — plain HTML/CSS/JS, no build step needed
- `database/schema.sql` — full schema + working sample data + 3 test accounts

## Prerequisites

- Java 17 (JDK)
- Maven
- MySQL 8+
- A way to serve static files (VS Code "Live Server" extension, or any
  local HTTP server) — do NOT just double-click the HTML files, since
  some browser security rules block fetch() calls from `file://` pages

## Setup — step by step

### 1. Database

Open MySQL Workbench (or the `mysql` CLI) and run the entire
`database/schema.sql` file. This creates the `altrium_db` database, all
five tables, and inserts:

- 3 test user accounts (see Test Accounts below)
- 3 sample job openings
- 5 sample candidates
- 3 sample interviews
- 1 sample interview feedback record

```bash
mysql -u root -p < database/schema.sql
```

Or in MySQL Workbench: open the file, click the lightning-bolt "Execute"
button to run the whole script.

### 2. Backend configuration

Open `backend/src/main/resources/application.properties` and update these
two lines with your actual MySQL credentials:

```properties
spring.datasource.username=root
spring.datasource.password=your_password_here
```

### 3. Run the backend

```bash
cd backend
mvn spring-boot:run
```

Wait for `Tomcat started on port 8080` with no red `ERROR` lines. Leave
this terminal running — it needs to stay open the whole time you're using
the app.

**If you see "Port 8080 was already in use":** something else is already
running on that port. Stop it first (Ctrl+C in whatever terminal is
running it, or find and kill the process), then try again.

### 4. Serve the frontend

The frontend is plain static files — open the `frontend/` folder with a
local web server. The simplest option if you use VS Code:

1. Install the "Live Server" extension
2. Right-click `frontend/login.html` → "Open with Live Server"
3. It'll open in your browser at something like `http://127.0.0.1:5500/...`

### 5. Log in

Go to the login page and use one of the test accounts below.

## Test Accounts

All three passwords are already hashed correctly in `schema.sql` — you
don't need to generate anything yourself.

| Role | Username | Password |
|---|---|---|
| HR | `hr_niduli` | `HrPass123!` |
| Hiring Manager | `hm_test` | `HmPass123!` |
| Interviewer | `interviewer_test` | `IvPass123!` |

## What each role can do

**HR** — creates and manages job openings, candidate profiles (with CV
upload), schedules interviews, submits feedback, and manages the whole
recruitment pipeline.

**Hiring Manager** — sees only job openings assigned to them (set via the
"Assign to Hiring Manager" dropdown when HR creates/edits a job opening),
along with their candidates, interviews, feedback, and a candidate ranking
and KPI dashboard.

**Interviewer** — sees only interviews where they're the assigned
interviewer (set via the "Interviewer" dropdown when HR schedules an
interview), the candidates tied to those interviews, and can submit
structured feedback.

## Project structure

```
altrium-recruitment-system/
├── backend/
│   ├── pom.xml
│   └── src/main/
│       ├── java/com/altrium/hrlogin/
│       │   ├── HrLoginApplication.java
│       │   ├── config/        (security, JWT)
│       │   ├── model/         (JPA entities)
│       │   ├── repository/    (Spring Data repositories)
│       │   ├── dto/           (request/response objects)
│       │   ├── service/       (business logic)
│       │   └── controller/    (REST endpoints)
│       └── resources/application.properties
├── frontend/
│   ├── login.html
│   ├── hr-dashboard.html, job-openings.html, candidates.html, interviews.html
│   ├── hiring-manager-dashboard.html, hm-*.html (8 pages)
│   ├── interviewer-dashboard.html, int-*.html (4 pages)
│   ├── css/
│   └── js/
├── database/schema.sql
├── README.md
└── TESTING.md
```

## API overview

All endpoints are under `http://localhost:8080`. See `TESTING.md` for
concrete request/response examples for every major flow.

| Prefix | Access | Purpose |
|---|---|---|
| `POST /api/auth/login` | public | Authenticate, returns JWT |
| `/api/hr/**` | HR role only | Job openings, candidates, interview scheduling (write) |
| `/api/hiring-manager/**` | Hiring Manager role only | Scoped dashboard, jobs, candidates, ranking, KPIs |
| `/api/interviewer/**` | Interviewer role only | Scoped dashboard, interviews, candidates, feedback |
| `/api/interviews/**` (GET) | any authenticated role | Shared read access to interview schedule/feedback |

Every request except login must include:
```
Authorization: Bearer <token>
```
where `<token>` is the JWT returned by the login endpoint.

## Known limitations (by design, not bugs)

- No "forgot password" flow for any role
- No in-app notifications
- One feedback record per interview (not one per evaluator) — a second
  submitter updates the existing record
- "Move to Next Stage" (Hiring Manager decision) sets a candidate directly
  to `HIRED` — there's no intermediate stage between Interview and a
  final decision in this model
- Evaluation criteria (Technical Skills, Communication, Problem Solving,
  Cultural Fit, Overall Recommendation) are fixed in the code, not
  configurable through the UI

See `TESTING.md` for a full walkthrough of every feature.
