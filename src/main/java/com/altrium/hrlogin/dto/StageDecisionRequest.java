package com.altrium.hrlogin.dto;

import jakarta.validation.constraints.NotBlank;

public class StageDecisionRequest {
    @NotBlank(message = "Decision is required")
    private String decision; // ADVANCE, REJECT, or ON_HOLD

    private String comment; // optional

    public String getDecision() { return decision; }
    public void setDecision(String decision) { this.decision = decision; }
    public String getComment() { return comment; }
    public void setComment(String comment) { this.comment = comment; }
}
