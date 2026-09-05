
package com.altrium.hrlogin.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public class HiringDecisionRequest {
    @NotBlank(message = "Decision is required")
    @Pattern(regexp = "HIRED|REJECTED", message = "Decision must be HIRED or REJECTED")
    private String decision;

    private String comment; // optional — no @NotBlank, this can be null/blank

    public String getDecision() { return decision; }
    public void setDecision(String decision) { this.decision = decision; }

    public String getComment() { return comment; }
    public void setComment(String comment) { this.comment = comment; }
}
