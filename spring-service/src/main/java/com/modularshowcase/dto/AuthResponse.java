package com.modularshowcase.dto;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;

public final class AuthResponse {

        private final String accessToken;
        private final String refreshToken;
        private final String tokenType;
        private final long expiresInMs;
        private final UserResponse user;

        @JsonCreator
        public AuthResponse(
                        @JsonProperty("accessToken") String accessToken,
                        @JsonProperty("refreshToken") String refreshToken,
                        @JsonProperty("tokenType") String tokenType,
                        @JsonProperty("expiresInMs") long expiresInMs,
                        @JsonProperty("user") UserResponse user
        ) {
                this.accessToken = accessToken;
                this.refreshToken = refreshToken;
                this.tokenType = tokenType;
                this.expiresInMs = expiresInMs;
                this.user = user;
        }

        public AuthResponse(
                        String accessToken,
                        String tokenType,
                        long expiresInMs,
                        UserResponse user
        ) {
                this(accessToken, null, tokenType, expiresInMs, user);
        }

        @JsonProperty("accessToken")
        public String accessToken() {
                return accessToken;
        }

        @JsonProperty("refreshToken")
        public String refreshToken() {
                return refreshToken;
        }

        @JsonProperty("tokenType")
        public String tokenType() {
                return tokenType;
        }

        @JsonProperty("expiresInMs")
        public long expiresInMs() {
                return expiresInMs;
        }

        @JsonProperty("user")
        public UserResponse user() {
                return user;
        }
}
