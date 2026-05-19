package com.modularshowcase.dto;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;

import jakarta.validation.constraints.NotBlank;

public final class AuthRefreshRequest {

        @NotBlank
        private final String refreshToken;

        @JsonCreator
        public AuthRefreshRequest(@JsonProperty("refreshToken") String refreshToken) {
                this.refreshToken = refreshToken;
        }

        @JsonProperty("refreshToken")
        public String refreshToken() {
                return refreshToken;
        }
}
