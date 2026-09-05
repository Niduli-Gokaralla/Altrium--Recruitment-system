package com.altrium.hrlogin.controller;

import com.altrium.hrlogin.model.User;
import com.altrium.hrlogin.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/hr/users")
@CrossOrigin(origins = "*")
public class UserDirectoryController {
    private final UserRepository userRepository;

    public UserDirectoryController(UserRepository userRepository) { this.userRepository = userRepository; }

    @GetMapping("/hiring-managers")
    public ResponseEntity<List<String>> listHiringManagers() {
        return ResponseEntity.ok(userRepository.findByRole("HIRING_MANAGER").stream().map(User::getUsername).toList());
    }

    @GetMapping("/interviewers")
    public ResponseEntity<List<String>> listInterviewers() {
        return ResponseEntity.ok(userRepository.findByRole("INTERVIEWER").stream().map(User::getUsername).toList());
    }
}
