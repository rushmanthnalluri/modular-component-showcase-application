package com.modularshowcase.dto;

public final class UserResponse {

        private final Long userId;
        private final String name;
        private final String fullName;
        private final String email;
        private final String phone;
        private final String role;

        public UserResponse(Long userId, String name, String fullName, String email, String phone, String role) {
                this.userId = userId;
                this.name = name;
                this.fullName = fullName;
                this.email = email;
                this.phone = phone;
                this.role = role;
        }

        public Long userId() {
                return userId;
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
}
