package com.altrium.hrlogin.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public class CandidateStageUpdateRequest {
    @NotBlank(message = "Stage is required")
    @Pattern(regexp = "APPLIED|SCREENING|SHORTLISTED|NOT_SHORTLISTED|INTERVIEW|HIRED|REJECTED", message = "Invalid stage value")
    private String stage;

    public String getStage() { return stage; }
    public void setStage(String stage) { this.stage = stage; }
}
