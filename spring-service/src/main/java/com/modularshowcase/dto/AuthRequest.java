package com.modularshowcase.dto;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public final class AuthRequest {

        @NotBlank
        @Email
        private final String email;

        @NotBlank
        @Pattern(regexp = "^(user|developer|admin|USER|DEVELOPER|ADMIN)$")
        private final String role;

        @JsonCreator
        public AuthRequest(
                        @JsonProperty("email") String email,
                        @JsonProperty("role") String role
        ) {
                this.email = email;
                this.role = role;
        }

        @JsonProperty("email")
        public String email() {
                return email;
        }

        @JsonProperty("role")
        public String role() {
                return role;
        }
}
