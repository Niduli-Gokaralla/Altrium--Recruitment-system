package com.altrium.hrlogin.dto;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Map;

public class HiringManagerDashboardResponse {
    private int myJobOpeningsCount, candidatesCount, interviewsCount, pendingDecisionsCount;
    private Map<String, Integer> pipeline;
    private List<CandidateAttention> candidatesRequiringAttention;
    private List<UpcomingInterview> upcomingInterviews;

    public int getMyJobOpeningsCount() { return myJobOpeningsCount; }
    public void setMyJobOpeningsCount(int v) { this.myJobOpeningsCount = v; }
    public int getCandidatesCount() { return candidatesCount; }
    public void setCandidatesCount(int v) { this.candidatesCount = v; }
    public int getInterviewsCount() { return interviewsCount; }
    public void setInterviewsCount(int v) { this.interviewsCount = v; }
    public int getPendingDecisionsCount() { return pendingDecisionsCount; }
    public void setPendingDecisionsCount(int v) { this.pendingDecisionsCount = v; }
    public Map<String, Integer> getPipeline() { return pipeline; }
    public void setPipeline(Map<String, Integer> v) { this.pipeline = v; }
    public List<CandidateAttention> getCandidatesRequiringAttention() { return candidatesRequiringAttention; }
    public void setCandidatesRequiringAttention(List<CandidateAttention> v) { this.candidatesRequiringAttention = v; }
    public List<UpcomingInterview> getUpcomingInterviews() { return upcomingInterviews; }
    public void setUpcomingInterviews(List<UpcomingInterview> v) { this.upcomingInterviews = v; }

    public static class CandidateAttention {
        public Long candidateId;
        public String candidateName, jobTitle, reason, stage;
    }

    public static class UpcomingInterview {
        public Long interviewId;
        public String candidateName, jobTitle, stage;
        public LocalDate interviewDate;
        public LocalTime interviewTime;
    }
}
