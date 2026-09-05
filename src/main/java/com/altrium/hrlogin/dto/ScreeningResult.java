package com.altrium.hrlogin.dto;

import java.util.List;

public class ScreeningResult {
    private boolean cvTextAvailable;
    private String extractionMessage; // populated only when CV text could NOT be used
    private String sourceUsed;        // "CV" or "PROFILE" — which text the match was run against
    private List<SkillMatch> skillMatches;
    private int matchScorePercent;
    private int cutoffScore;
    private String recommendation;    // SHORTLIST or REJECT

    public boolean isCvTextAvailable() { return cvTextAvailable; }
    public void setCvTextAvailable(boolean cvTextAvailable) { this.cvTextAvailable = cvTextAvailable; }
    public String getExtractionMessage() { return extractionMessage; }
    public void setExtractionMessage(String extractionMessage) { this.extractionMessage = extractionMessage; }
    public String getSourceUsed() { return sourceUsed; }
    public void setSourceUsed(String sourceUsed) { this.sourceUsed = sourceUsed; }
    public List<SkillMatch> getSkillMatches() { return skillMatches; }
    public void setSkillMatches(List<SkillMatch> skillMatches) { this.skillMatches = skillMatches; }
    public int getMatchScorePercent() { return matchScorePercent; }
    public void setMatchScorePercent(int matchScorePercent) { this.matchScorePercent = matchScorePercent; }
    public int getCutoffScore() { return cutoffScore; }
    public void setCutoffScore(int cutoffScore) { this.cutoffScore = cutoffScore; }
    public String getRecommendation() { return recommendation; }
    public void setRecommendation(String recommendation) { this.recommendation = recommendation; }

    public static class SkillMatch {
        public String skill;
        public boolean matched;

        public SkillMatch(String skill, boolean matched) {
            this.skill = skill;
            this.matched = matched;
        }

        public String getSkill() { return skill; }
        public boolean isMatched() { return matched; }
    }
}
