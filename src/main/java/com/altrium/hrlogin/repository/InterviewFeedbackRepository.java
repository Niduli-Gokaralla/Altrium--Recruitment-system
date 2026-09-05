package com.altrium.hrlogin.repository;

import com.altrium.hrlogin.model.InterviewFeedback;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface InterviewFeedbackRepository extends JpaRepository<InterviewFeedback, Long> {
    Optional<InterviewFeedback> findByInterviewIdAndEvaluatorRole(Long interviewId, String evaluatorRole);
    List<InterviewFeedback> findAllByInterviewId(Long interviewId);
}
