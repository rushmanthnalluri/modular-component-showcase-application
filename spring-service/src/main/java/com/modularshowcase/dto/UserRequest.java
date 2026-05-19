package com.modularshowcase.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public final class UserRequest {

        @NotBlank
        @Size(max = 120)
        private final String name;

        @NotBlank
        @Size(max = 120)
        private final String fullName;

        @NotBlank
        @Email
        private final String email;

        @NotBlank
        @Pattern(regexp = "^[0-9+()\\-\\s]{10,20}$")
        private final String phone;

        @NotBlank
        @Pattern(regexp = "^(user|developer|admin|USER|DEVELOPER|ADMIN)$")
        private final String role;

        @NotBlank
        @Size(min = 8, max = 128)
        private final String password;

        public UserRequest(String name, String fullName, String email, String phone, String role, String password) {
                this.name = name;
                this.fullName = fullName;
                this.email = email;
                this.phone = phone;
                this.role = role;
                this.password = password;
        }

        public String name() {
                return name;
        }

        public String fullName() {
                return fullName;
        }

        public String email() {
                return email;
        }

        public String phone() {
                return phone;
        }

        public String role() {
                return role;
        }

        public String password() {
                return password;
        }
}
