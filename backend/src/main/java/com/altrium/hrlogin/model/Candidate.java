package com.altrium.hrlogin.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "candidates")
public class Candidate {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String fullName;

    @Column(nullable = false)
    private String email;

    private String phone;

    @Column(name = "job_opening_id", nullable = false)
    private Long jobOpeningId;

    @Column(columnDefinition = "TEXT")
    private String skills;

    private String experience;

    @Column(columnDefinition = "TEXT")
    private String qualifications;

    @Column(nullable = false)
    private String stage = "APPLIED";

    private String cvFileName;
    private String cvStoredName;
    private String cvContentType;
    private Long cvFileSize;

    @Column(nullable = false)
    private String createdBy;

    @Column(nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    public Candidate() {}

    public Long getId() { return id; }
    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }
    public Long getJobOpeningId() { return jobOpeningId; }
    public void setJobOpeningId(Long jobOpeningId) { this.jobOpeningId = jobOpeningId; }
    public String getSkills() { return skills; }
    public void setSkills(String skills) { this.skills = skills; }
    public String getExperience() { return experience; }
    public void setExperience(String experience) { this.experience = experience; }
    public String getQualifications() { return qualifications; }
    public void setQualifications(String qualifications) { this.qualifications = qualifications; }
    public String getStage() { return stage; }
    public void setStage(String stage) { this.stage = stage; }
    public String getCvFileName() { return cvFileName; }
    public void setCvFileName(String cvFileName) { this.cvFileName = cvFileName; }
    public String getCvStoredName() { return cvStoredName; }
    public void setCvStoredName(String cvStoredName) { this.cvStoredName = cvStoredName; }
    public String getCvContentType() { return cvContentType; }
    public void setCvContentType(String cvContentType) { this.cvContentType = cvContentType; }
    public Long getCvFileSize() { return cvFileSize; }
    public void setCvFileSize(Long cvFileSize) { this.cvFileSize = cvFileSize; }
    public String getCreatedBy() { return createdBy; }
    public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
