package com.altrium.hrlogin.dto;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

public class InterviewerDashboardResponse {
    private int assignedInterviewsCount, candidatesCount, pendingFeedbackCount;
    private List<UpcomingInterview> upcomingInterviews;
    private List<PendingFeedback> pendingFeedback;

    public int getAssignedInterviewsCount() { return assignedInterviewsCount; }
    public void setAssignedInterviewsCount(int v) { this.assignedInterviewsCount = v; }
    public int getCandidatesCount() { return candidatesCount; }
    public void setCandidatesCount(int v) { this.candidatesCount = v; }
    public int getPendingFeedbackCount() { return pendingFeedbackCount; }
    public void setPendingFeedbackCount(int v) { this.pendingFeedbackCount = v; }
    public List<UpcomingInterview> getUpcomingInterviews() { return upcomingInterviews; }
    public void setUpcomingInterviews(List<UpcomingInterview> v) { this.upcomingInterviews = v; }
    public List<PendingFeedback> getPendingFeedback() { return pendingFeedback; }
    public void setPendingFeedback(List<PendingFeedback> v) { this.pendingFeedback = v; }

    public static class UpcomingInterview {
        public Long interviewId;
        public String candidateName, jobOpeningTitle, stage;
        public LocalDate interviewDate;
        public LocalTime interviewTime;
    }

    public static class PendingFeedback {
        public Long interviewId;
        public String candidateName, jobOpeningTitle, stage;
        public LocalDate interviewDate;
    }
}
