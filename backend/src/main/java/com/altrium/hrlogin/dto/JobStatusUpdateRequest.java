package com.altrium.hrlogin.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public class JobStatusUpdateRequest {
    @NotBlank(message = "Status is required")
    @Pattern(regexp = "OPEN|ON_HOLD|CLOSED", message = "Status must be OPEN, ON_HOLD, or CLOSED")
    private String status;

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}
