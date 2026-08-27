# Altrium Recruitment System — TESTING.md

Step-by-step test scenarios for every major feature. Run these in order —
later scenarios build on data created in earlier ones (though the sample
data in schema.sql already covers most of this out of the box).

Do the setup steps in README.md first: run schema.sql, start the backend,
serve the frontend.

---

## 1. HR Login (US-01)

1. Go to the login page
2. Enter hr_niduli / HrPass123!
3. Click Log In

Expected: redirected to hr-dashboard.html, showing KPI cards and a
welcome message.

Also test: enter a wrong password — expect a red "Invalid username or
password" message, and the password field stays masked throughout.

---

## 2. Hiring Manager Login (US-02)

1. Log out, go back to login
2. Enter hm_test / HmPass123!

Expected: redirected to hiring-manager-dashboard.html, showing "My
Job Openings: 1" (the Software Engineer role is pre-assigned to this
account in the sample data).

---

## 3. Interviewer Login (US-03)

1. Log out, log in with interviewer_test / IvPass123!

Expected: redirected to interviewer-dashboard.html, showing
"Assigned Interviews: 3" (from the sample data).

---

## 4. Create a Job Opening (US-07)

1. Log in as HR
2. Go to Job Openings -> Create Job Opening
3. Fill in:
   - Title: Backend Developer
   - Department: IT
   - Location: Colombo
   - Employment Type: Full-time
   - Vacancies: 1
   - Description: any text
   - Qualifications: any text
   - Skills: Java, PostgreSQL
   - Experience: 2-4 years
4. Submit

Expected: success message, and the job appears in the table
immediately with status "Open".

Also test: leave the Title blank and submit — expect a validation
error, no job created.

---

## 5. Edit a Job Opening (US-08)

1. On the Job Openings page, click "Edit" on the Backend Developer job you
   just created
2. Change the title to Senior Backend Developer
3. Save

Expected: confirmation message, updated title shows in the table.

---

## 6. Create a Candidate Profile (US-09)

1. Go to Candidates -> Add Candidate
2. Fill in:
   - Full Name: Test Candidate
   - Email: test.candidate@example.com
   - Applied Position: Software Engineer
   - Skills: Java, SQL
3. Optionally attach a .pdf file under 5MB as the CV
4. Submit

Expected: success message, candidate appears in the table with stage
"Applied".

Also test: try uploading a .txt file as the CV — expect a validation
error ("CV must be a PDF, DOC, or DOCX file").

---

## 7. Filter Candidates (US-12)

1. On the Candidates page, type "Amara" into the search box

Expected: table narrows to just Amara Silva.

2. Clear the search, instead select "Software Engineer" in the position
   filter AND "Interview" in the stage filter at the same time

Expected: only candidates matching BOTH filters show (Amara Silva).

3. Click Clear — expect the full list back.

---

## 8. Screen a Candidate / Shortlist Decision (US-14)

1. Click "View" on Tharindu Wickramasinghe (currently stage "Applied")
2. In the profile view, compare his skills against the Software Engineer
   job's required skills shown side-by-side
3. Click "Shortlist"

Expected: confirmation message, his stage badge updates to
"Shortlisted" immediately.

---

## 9. Schedule an Interview (US-23)

1. Go to Interview Schedule -> Schedule Interview
2. Candidate dropdown: only Shortlisted/Interview-stage candidates appear
   — select Ruwan Perera (already Shortlisted in sample data)
3. Date: any future date
4. Time: any time
5. Interviewer: select interviewer_test
6. Stage: HR Interview
7. Submit

Expected: confirmation message, new row appears in the schedule.

Also test: leave the Interviewer field unselected — expect a
validation error.

---

## 10. Submit Interview Feedback (US-28)

1. On Interview Schedule, click "View" on the completed interview for
   Amara Silva (pre-loaded in sample data)
2. You should see existing feedback (scores + comments) already there,
   submitted by interviewer_test
3. Click "Edit Feedback", change one score, save

Expected: confirmation, updated score shown immediately — this
demonstrates the "cannot be accidentally overwritten" requirement (you saw
the existing values before saving over them).

4. Now find a different interview with no feedback yet (Ishara Fernando's
   upcoming interview) — you'll need to mark its status "Completed" first
   via Edit, then submit fresh feedback with all 5 scores + comments.

---

## 11. Hiring Manager: Review Feedback and Make a Decision (US-16, US-37)

1. Log in as hm_test
2. Go to Feedback & Decisions
3. You should see Amara Silva listed (stage = Interview, job assigned to
   this Hiring Manager)
4. Click "Review" — see her existing interview feedback
5. Click "Move to Next Stage"

Expected: confirmation, her stage becomes "Hired".

Also test: try this on a candidate with NO feedback submitted yet —
the Move to Next Stage / Reject buttons should not appear (or the server
should reject with a 400 if called directly), per the requirement that
feedback must be completed first.

---

## 12. Candidate Ranking (US-35)

1. As hm_test, go to Candidate Ranking
2. Filter by "Software Engineer"

Expected: Amara Silva appears ranked with her total score (average of
her feedback scores). Candidates with no feedback appear in a separate
"Incomplete Evaluations" section below, not mixed into the ranking.

3. Click "Details" on Amara's row — see the full breakdown of scores per
   interview.

---

## 13. Reports / KPIs (US-36)

1. As hm_test, go to Reports

Expected: KPI cards show real counts (1 job opening, candidates,
hired count), the pipeline breakdown shows candidates by stage, and the
per-job table shows the Software Engineer job's average score.

---

## 14. Interviewer: My Interviews and My Candidates (AC-22, AC-24)

1. Log in as interviewer_test
2. Go to My Interviews — see the 3 sample interviews, all involving this
   account as interviewer
3. Go to My Candidates — see only the candidates tied to those 3
   interviews (Amara, Ruwan, Ishara) — NOT Nadeesha or Tharindu, since
   they're not part of any interview assigned to this interviewer

Expected: the scoping is correct — an Interviewer never sees
candidates or interviews outside their own assignments.

---

## 15. Role-based Access Control (cross-cutting)

1. Open DevTools, log in as interviewer_test, copy the JWT from
   sessionStorage (key: authToken)
2. Try calling an HR-only endpoint directly:

curl -H "Authorization: Bearer <paste_token_here>" http://localhost:8080/api/hr/jobs

Expected: 403 Forbidden — an Interviewer's token cannot access
HR-only endpoints, even by calling the API directly (not just hidden in
the UI).

---

## API request/response examples

### Login

POST http://localhost:8080/api/auth/login
Content-Type: application/json

{ "username": "hr_niduli", "password": "HrPass123!" }

Response:
{
  "token": "eyJhbGciOiJIUzI1NiJ9...",
  "username": "hr_niduli",
  "role": "HR",
  "message": "Login successful"
}

### Create Job Opening

POST http://localhost:8080/api/hr/jobs
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Backend Developer",
  "department": "IT",
  "location": "Colombo",
  "employmentType": "Full-time",
  "vacancies": 1,
  "description": "...",
  "qualifications": "...",
  "skills": "Java, PostgreSQL",
  "experienceRequired": "2-4 years"
}

Response: 201 Created with the full job opening object, including its
new id.

### Submit Interview Feedback

POST http://localhost:8080/api/hr/interviews/1/feedback
Authorization: Bearer <token>
Content-Type: application/json

{
  "technicalSkills": 4,
  "communication": 4,
  "problemSolving": 5,
  "culturalFit": 4,
  "overallRecommendation": 4,
  "comments": "Strong candidate overall."
}

Response: 200 OK with the saved feedback object.

### Error response shape (validation failure)

{
  "title": "Job title is required",
  "department": "Department is required"
}

### Error response shape (not found / forbidden)

{ "message": "Candidate not found" }
