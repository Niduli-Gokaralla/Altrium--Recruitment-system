package com.altrium.hrlogin.dto;

public class CandidateRequest {
    private String fullName, email, phone, skills, experience, qualifications, stage;
    private Long jobOpeningId;

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
}
