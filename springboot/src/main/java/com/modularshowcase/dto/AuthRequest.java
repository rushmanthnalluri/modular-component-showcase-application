package com.modularshowcase.dto;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public final class AuthRequest {

        @NotBlank
        @Email
        private final String email;

        @NotBlank
        @Pattern(regexp = "^(user|developer|admin|USER|DEVELOPER|ADMIN)$")
        private final String role;

        @NotBlank
        @Size(min = 8, max = 128)
        private final String password;

        @JsonCreator
        public AuthRequest(
                        @JsonProperty("email") String email,
                        @JsonProperty("role") String role,
                        @JsonProperty("password") String password
        ) {
                this.email = email;
                this.role = role;
                this.password = password;
        }

        @JsonProperty("email")
        public String email() {
                return email;
        }

        @JsonProperty("role")
        public String role() {
                return role;
        }

        @JsonProperty("password")
        public String password() {
                return password;
        }
}
