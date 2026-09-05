package com.altrium.hrlogin.dto;

import com.altrium.hrlogin.model.Candidate;
import java.time.LocalDateTime;

public class CandidateResponse {
    private Long id, jobOpeningId, cvFileSize;
    private String fullName, email, phone, jobOpeningTitle, skills, experience,
            qualifications, stage, cvFileName, createdBy;
    private boolean hasCv;
    private LocalDateTime createdAt;

    public CandidateResponse(Candidate c, String jobOpeningTitle) {
        this.id = c.getId();
        this.fullName = c.getFullName();
        this.email = c.getEmail();
        this.phone = c.getPhone();
        this.jobOpeningId = c.getJobOpeningId();
        this.jobOpeningTitle = jobOpeningTitle;
        this.skills = c.getSkills();
        this.experience = c.getExperience();
        this.qualifications = c.getQualifications();
        this.stage = c.getStage();
        this.cvFileName = c.getCvFileName();
        this.cvFileSize = c.getCvFileSize();
        this.hasCv = c.getCvStoredName() != null;
        this.createdBy = c.getCreatedBy();
        this.createdAt = c.getCreatedAt();
    }

    public Long getId() { return id; }
    public String getFullName() { return fullName; }
    public String getEmail() { return email; }
    public String getPhone() { return phone; }
    public Long getJobOpeningId() { return jobOpeningId; }
    public String getJobOpeningTitle() { return jobOpeningTitle; }
    public String getSkills() { return skills; }
    public String getExperience() { return experience; }
    public String getQualifications() { return qualifications; }
    public String getStage() { return stage; }
    public String getCvFileName() { return cvFileName; }
    public Long getCvFileSize() { return cvFileSize; }
    public boolean isHasCv() { return hasCv; }
    public String getCreatedBy() { return createdBy; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}
