package com.altrium.hrlogin.repository;

import com.altrium.hrlogin.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByUsername(String username);
    List<User> findByRole(String role);
    Optional<User> findByResetTokenHash(String resetTokenHash);
}
