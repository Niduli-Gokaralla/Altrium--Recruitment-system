package com.altrium.hrlogin.repository;

import com.altrium.hrlogin.model.Candidate;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface CandidateRepository extends JpaRepository<Candidate, Long> {
    List<Candidate> findAllByOrderByCreatedAtDesc();
}
