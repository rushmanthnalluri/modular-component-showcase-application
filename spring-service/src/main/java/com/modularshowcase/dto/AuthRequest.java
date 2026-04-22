package com.modularshowcase.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public final class AuthRequest {

        @NotBlank
        @Email
        private final String email;

        @NotBlank
        private final String role;

        public AuthRequest(String email, String role) {
                this.email = email;
                this.role = role;
        }

        public String email() {
                return email;
        }

        public String role() {
                return role;
        }
}
