package com.altrium.hrlogin.dto;

import com.altrium.hrlogin.model.JobOpening;
import java.time.LocalDate;
import java.time.LocalDateTime;

public class JobOpeningResponse {
    private Long id;
    private String title, department, location, employmentType, description,
            qualifications, skills, experienceRequired, status, interviewStages, assignedTo, createdBy;
    private Integer vacancies, cutoffScore;
    private LocalDate applicationDeadline;
    private LocalDateTime createdAt;

    public JobOpeningResponse(JobOpening job) {
        this.id = job.getId();
        this.title = job.getTitle();
        this.department = job.getDepartment();
        this.location = job.getLocation();
        this.employmentType = job.getEmploymentType();
        this.vacancies = job.getVacancies();
        this.description = job.getDescription();
        this.qualifications = job.getQualifications();
        this.skills = job.getSkills();
        this.experienceRequired = job.getExperienceRequired();
        this.applicationDeadline = job.getApplicationDeadline();
        this.status = job.getStatus();
        this.interviewStages = job.getInterviewStages();
        this.assignedTo = job.getAssignedTo();
        this.createdBy = job.getCreatedBy();
        this.createdAt = job.getCreatedAt();
        this.cutoffScore = job.getCutoffScore();
    }

    public Long getId() { return id; }
    public String getTitle() { return title; }
    public String getDepartment() { return department; }
    public String getLocation() { return location; }
    public String getEmploymentType() { return employmentType; }
    public Integer getVacancies() { return vacancies; }
    public String getDescription() { return description; }
    public String getQualifications() { return qualifications; }
    public String getSkills() { return skills; }
    public String getExperienceRequired() { return experienceRequired; }
    public LocalDate getApplicationDeadline() { return applicationDeadline; }
    public String getStatus() { return status; }
    public String getInterviewStages() { return interviewStages; }
    public String getAssignedTo() { return assignedTo; }
    public String getCreatedBy() { return createdBy; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public Integer getCutoffScore() { return cutoffScore; }
}
