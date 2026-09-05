package com.altrium.hrlogin.dto;

import com.altrium.hrlogin.model.User;

public class UserProfileResponse {
    private String username, email, role;

    public UserProfileResponse(User user) {
        this.username = user.getUsername();
        this.email = user.getEmail();
        this.role = user.getRole();
    }

    public String getUsername() { return username; }
    public String getEmail() { return email; }
    public String getRole() { return role; }
}
