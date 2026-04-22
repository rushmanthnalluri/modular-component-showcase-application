package com.modularshowcase.dto;

public final class AuthResponse {

        private final String accessToken;
        private final String tokenType;
        private final long expiresInMs;
        private final UserResponse user;

        public AuthResponse(String accessToken, String tokenType, long expiresInMs, UserResponse user) {
                this.accessToken = accessToken;
                this.tokenType = tokenType;
                this.expiresInMs = expiresInMs;
                this.user = user;
        }

        public String accessToken() {
                return accessToken;
        }

        public String tokenType() {
                return tokenType;
        }

        public long expiresInMs() {
                return expiresInMs;
        }

        public UserResponse user() {
                return user;
        }
}
