package com.modularshowcase.dto;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;

public final class UserResponse {

        private final Long userId;
        private final String name;
        private final String fullName;
        private final String email;
        private final String phone;
        private final String role;

        @JsonCreator
        public UserResponse(
                        @JsonProperty("userId") Long userId,
                        @JsonProperty("name") String name,
                        @JsonProperty("fullName") String fullName,
                        @JsonProperty("email") String email,
                        @JsonProperty("phone") String phone,
                        @JsonProperty("role") String role
        ) {
                this.userId = userId;
                this.name = name;
                this.fullName = fullName;
                this.email = email;
                this.phone = phone;
                this.role = role;
        }

        @JsonProperty("userId")
        public Long userId() {
                return userId;
        }

        @JsonProperty("name")
        public String name() {
                return name;
        }

        @JsonProperty("fullName")
        public String fullName() {
                return fullName;
        }

        @JsonProperty("email")
        public String email() {
                return email;
        }

        @JsonProperty("phone")
        public String phone() {
                return phone;
        }

        @JsonProperty("role")
        public String role() {
                return role;
        }
}
