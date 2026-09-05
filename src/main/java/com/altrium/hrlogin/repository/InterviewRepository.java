package com.altrium.hrlogin.repository;

import com.altrium.hrlogin.model.Interview;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface InterviewRepository extends JpaRepository<Interview, Long> {
    List<Interview> findAllByOrderByInterviewDateAscInterviewTimeAsc();
}
