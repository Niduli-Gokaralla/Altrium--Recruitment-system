package com.altrium.hrlogin.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;

public class JobOpeningRequest {
    @NotBlank(message = "Job title is required") @Size(max = 150)
    private String title;
    @NotBlank(message = "Department is required")
    private String department;
    @NotBlank(message = "Location is required")
    private String location;
    @NotBlank(message = "Employment type is required")
    private String employmentType;
    @NotNull(message = "Number of vacancies is required") @Min(value = 1)
    private Integer vacancies;
    @NotBlank(message = "Job description is required")
    private String description;
    @NotBlank(message = "Required qualifications are required")
    private String qualifications;
    @NotBlank(message = "Required skills are required")
    private String skills;
    @NotBlank(message = "Experience required is required")
    private String experienceRequired;
    private LocalDate applicationDeadline;
    private String status;
    private String interviewStages;
    private String assignedTo;

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getDepartment() { return department; }
    public void setDepartment(String department) { this.department = department; }
    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }
    public String getEmploymentType() { return employmentType; }
    public void setEmploymentType(String employmentType) { this.employmentType = employmentType; }
    public Integer getVacancies() { return vacancies; }
    public void setVacancies(Integer vacancies) { this.vacancies = vacancies; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getQualifications() { return qualifications; }
    public void setQualifications(String qualifications) { this.qualifications = qualifications; }
    public String getSkills() { return skills; }
    public void setSkills(String skills) { this.skills = skills; }
    public String getExperienceRequired() { return experienceRequired; }
    public void setExperienceRequired(String experienceRequired) { this.experienceRequired = experienceRequired; }
    public LocalDate getApplicationDeadline() { return applicationDeadline; }
    public void setApplicationDeadline(LocalDate applicationDeadline) { this.applicationDeadline = applicationDeadline; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getInterviewStages() { return interviewStages; }
    public void setInterviewStages(String interviewStages) { this.interviewStages = interviewStages; }
    public String getAssignedTo() { return assignedTo; }
    public void setAssignedTo(String assignedTo) { this.assignedTo = assignedTo; }
}
