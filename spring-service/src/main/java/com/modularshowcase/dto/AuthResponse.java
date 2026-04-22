package com.modularshowcase.dto;

public record AuthResponse(
        String accessToken,
        String tokenType,
        long expiresInMs,
        UserResponse user
) {
}
