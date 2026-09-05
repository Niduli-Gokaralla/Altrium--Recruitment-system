package com.altrium.hrlogin.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "notifications")
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "recipient_username", nullable = false)
    private String recipientUsername;

    @Column(nullable = false)
    private String type; // CANDIDATE_STAGE_CHANGE, NEW_CANDIDATE_ASSIGNED, INTERVIEW_ASSIGNED

    @Column(nullable = false, columnDefinition = "TEXT")
    private String message;

    @Column(name = "related_candidate_id")
    private Long relatedCandidateId;

    @Column(name = "related_interview_id")
    private Long relatedInterviewId;

    @Column(name = "is_read", nullable = false)
    private boolean isRead = false;

    @Column(nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    public Notification() {}

    public Notification(String recipientUsername, String type, String message, Long relatedCandidateId, Long relatedInterviewId) {
        this.recipientUsername = recipientUsername;
        this.type = type;
        this.message = message;
        this.relatedCandidateId = relatedCandidateId;
        this.relatedInterviewId = relatedInterviewId;
    }

    public Long getId() { return id; }
    public String getRecipientUsername() { return recipientUsername; }
    public void setRecipientUsername(String recipientUsername) { this.recipientUsername = recipientUsername; }
    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
    public Long getRelatedCandidateId() { return relatedCandidateId; }
    public void setRelatedCandidateId(Long relatedCandidateId) { this.relatedCandidateId = relatedCandidateId; }
    public Long getRelatedInterviewId() { return relatedInterviewId; }
    public void setRelatedInterviewId(Long relatedInterviewId) { this.relatedInterviewId = relatedInterviewId; }
    public boolean isRead() { return isRead; }
    public void setRead(boolean read) { isRead = read; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
