package com.altrium.hrlogin.dto;

import com.altrium.hrlogin.model.Notification;
import java.time.LocalDateTime;

public class NotificationResponse {
    private Long id, relatedCandidateId, relatedInterviewId;
    private String type, message;
    private boolean read;
    private LocalDateTime createdAt;

    public NotificationResponse(Notification n) {
        this.id = n.getId();
        this.type = n.getType();
        this.message = n.getMessage();
        this.relatedCandidateId = n.getRelatedCandidateId();
        this.relatedInterviewId = n.getRelatedInterviewId();
        this.read = n.isRead();
        this.createdAt = n.getCreatedAt();
    }

    public Long getId() { return id; }
    public String getType() { return type; }
    public String getMessage() { return message; }
    public Long getRelatedCandidateId() { return relatedCandidateId; }
    public Long getRelatedInterviewId() { return relatedInterviewId; }
    public boolean isRead() { return read; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}
