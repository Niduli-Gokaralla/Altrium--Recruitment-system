-- =====================================================================
-- Altrium Recruitment System — Full Database Schema + Sample Data
-- =====================================================================
-- Run this entire file against a fresh MySQL server:
--   mysql -u root -p < schema.sql
-- Or paste it into MySQL Workbench and execute all.
-- =====================================================================

CREATE DATABASE IF NOT EXISTS altrium_db;
USE altrium_db;

-- ---------------------------------------------------------------------
-- USERS (login accounts for all three roles)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,   -- BCrypt hash
    role VARCHAR(20) NOT NULL,        -- HR, HIRING_MANAGER, INTERVIEWER
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ---------------------------------------------------------------------
-- JOB OPENINGS
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS job_openings (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(150) NOT NULL,
    department VARCHAR(100) NOT NULL,
    location VARCHAR(100) NOT NULL,
    employment_type VARCHAR(50) NOT NULL,
    vacancies INT NOT NULL,
    description TEXT NOT NULL,
    qualifications TEXT,
    skills TEXT,
    experience_required VARCHAR(100),
    application_deadline DATE,
    status VARCHAR(20) NOT NULL DEFAULT 'OPEN',   -- OPEN, ON_HOLD, CLOSED
    interview_stages TEXT,
    assigned_to VARCHAR(50),   -- username of the Hiring Manager, nullable
    created_by VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ---------------------------------------------------------------------
-- CANDIDATES
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS candidates (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(150) NOT NULL,
    email VARCHAR(150) NOT NULL,
    phone VARCHAR(30),
    job_opening_id BIGINT NOT NULL,
    skills TEXT,
    experience VARCHAR(100),
    qualifications TEXT,
    stage VARCHAR(20) NOT NULL DEFAULT 'APPLIED',  -- APPLIED, SCREENING, SHORTLISTED, NOT_SHORTLISTED, INTERVIEW, HIRED, REJECTED
    cv_file_name VARCHAR(255),
    cv_stored_name VARCHAR(255),
    cv_content_type VARCHAR(100),
    cv_file_size BIGINT,
    created_by VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_candidate_job FOREIGN KEY (job_opening_id) REFERENCES job_openings(id)
);

-- ---------------------------------------------------------------------
-- INTERVIEWS
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS interviews (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    candidate_id BIGINT NOT NULL,
    interview_date DATE NOT NULL,
    interview_time TIME NOT NULL,
    interviewer VARCHAR(150) NOT NULL,   -- must match a real users.username with role INTERVIEWER
    stage VARCHAR(100) NOT NULL,         -- e.g. CV Screening, Technical Interview, HR Interview, Final Review
    status VARCHAR(20) NOT NULL DEFAULT 'SCHEDULED',  -- SCHEDULED, COMPLETED, CANCELLED
    created_by VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_interview_candidate FOREIGN KEY (candidate_id) REFERENCES candidates(id)
);

-- ---------------------------------------------------------------------
-- INTERVIEW FEEDBACK
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS interview_feedback (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    interview_id BIGINT NOT NULL UNIQUE,
    technical_skills INT NOT NULL,
    communication INT NOT NULL,
    problem_solving INT NOT NULL,
    cultural_fit INT NOT NULL,
    overall_recommendation INT NOT NULL,
    comments TEXT,
    submitted_by VARCHAR(50) NOT NULL,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_feedback_interview FOREIGN KEY (interview_id) REFERENCES interviews(id)
);

-- =====================================================================
-- SAMPLE / TEST DATA
-- =====================================================================

-- ---------------------------------------------------------------------
-- Test users — one per role. Passwords below are REAL, working BCrypt
-- hashes (generated fresh, not placeholders) — you do NOT need to
-- generate these yourself.
--
--   Username           Password        Role
--   hr_niduli          HrPass123!      HR
--   hm_test            HmPass123!      HIRING_MANAGER
--   interviewer_test   IvPass123!      INTERVIEWER
-- ---------------------------------------------------------------------
INSERT INTO users (username, password, role) VALUES
('hr_niduli',        '$2b$10$9ZqUaDJ/yKV3dqel02Fipu48.hHjRk/Z46L6yWKb/YmM1W/uF4A.i', 'HR'),
('hm_test',          '$2b$10$808LeW/Dh0uQhC30m9Ou7.LdDwsCGwzTlwvtb8S7RJeCRCIW4Izxi', 'HIRING_MANAGER'),
('interviewer_test', '$2b$10$QOgQ9LBpYzwLZLSypzVqzefXl/vWCHZKRhwoFvt7d86No18ACASwC', 'INTERVIEWER');

-- ---------------------------------------------------------------------
-- Sample job openings (3), one assigned to the Hiring Manager test user
-- ---------------------------------------------------------------------
INSERT INTO job_openings (title, department, location, employment_type, vacancies, description, qualifications, skills, experience_required, status, interview_stages, assigned_to, created_by) VALUES
('Software Engineer', 'IT', 'Colombo', 'Full-time', 2,
 'We are looking for a Software Engineer to join our development team, working on backend services and APIs.',
 'Bachelor''s degree in Computer Science or related field',
 'Java, Spring Boot, SQL, Git', '1-3 years', 'OPEN',
 'CV Screening,Technical Interview,HR Interview,Final Review', 'hm_test', 'hr_niduli'),

('Data Analyst', 'Finance', 'Colombo', 'Full-time', 1,
 'Analyze financial and operational data to support business decisions, build dashboards and reports for stakeholders.',
 'Bachelor''s degree in Statistics, Finance, or a related field',
 'SQL, Excel, Power BI, Python', '1-3 years', 'OPEN',
 'CV Screening,Technical Interview,HR Interview', 'hm_test', 'hr_niduli'),

('UI/UX Designer', 'Design', 'Remote', 'Part-time', 1,
 'Design user interfaces and experiences for the Altrium recruitment platform, working closely with the development team.',
 'Portfolio demonstrating UI/UX design work',
 'Figma, Adobe XD, Wireframing, Prototyping', '2+ years', 'OPEN',
 'CV Screening,Technical Interview,Final Review', NULL, 'hr_niduli');

-- ---------------------------------------------------------------------
-- Sample candidates (5), spread across the job openings and stages
-- ---------------------------------------------------------------------
INSERT INTO candidates (full_name, email, phone, job_opening_id, skills, experience, qualifications, stage, created_by) VALUES
('Amara Silva', 'amara.silva@example.com', '0771234567', 1, 'Java, Spring Boot, SQL', '2 years', 'BSc in Computer Science', 'INTERVIEW', 'hr_niduli'),
('Ruwan Perera', 'ruwan.perera@example.com', '0779876543', 1, 'Python, Django, REST APIs', '3 years', 'BSc in Software Engineering', 'SHORTLISTED', 'hr_niduli'),
('Ishara Fernando', 'ishara.fernando@example.com', '0712345678', 3, 'Figma, UI/UX, HTML/CSS', '1 year', 'Diploma in Graphic Design', 'INTERVIEW', 'hr_niduli'),
('Nadeesha Jayasuriya', 'nadeesha.j@example.com', '0765432109', 2, 'Excel, Power BI, SQL', '4 years', 'BSc in Statistics', 'APPLIED', 'hr_niduli'),
('Tharindu Wickramasinghe', 'tharindu.w@example.com', '0723456789', 1, 'React, JavaScript, Node.js', '2 years', 'BSc in Computer Science', 'APPLIED', 'hr_niduli');

-- ---------------------------------------------------------------------
-- Sample interviews — all assigned to interviewer_test so the
-- Interviewer test account has real data to work with
-- ---------------------------------------------------------------------
INSERT INTO interviews (candidate_id, interview_date, interview_time, interviewer, stage, status, created_by) VALUES
(1, CURDATE() - INTERVAL 2 DAY, '10:00:00', 'interviewer_test', 'Technical Interview', 'COMPLETED', 'hr_niduli'),
(3, CURDATE() + INTERVAL 3 DAY, '14:30:00', 'interviewer_test', 'Technical Interview', 'SCHEDULED', 'hr_niduli'),
(2, CURDATE() + INTERVAL 5 DAY, '11:00:00', 'interviewer_test', 'CV Screening', 'SCHEDULED', 'hr_niduli');

-- ---------------------------------------------------------------------
-- Sample feedback for the completed interview (candidate 1), so the
-- Feedback & Decisions / Candidate Ranking / Reports pages have real
-- data to display immediately
-- ---------------------------------------------------------------------
INSERT INTO interview_feedback (interview_id, technical_skills, communication, problem_solving, cultural_fit, overall_recommendation, comments, submitted_by) VALUES
(1, 4, 4, 5, 4, 4, 'Strong technical fundamentals, communicates clearly, good problem-solving approach during the coding exercise.', 'interviewer_test');
