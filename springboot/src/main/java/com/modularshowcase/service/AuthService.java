package com.modularshowcase.service;

import java.util.Objects;

import org.springframework.lang.NonNull;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.modularshowcase.dto.AuthRefreshRequest;
import com.modularshowcase.dto.AuthRequest;
import com.modularshowcase.dto.AuthResponse;
import com.modularshowcase.dto.UserResponse;
import com.modularshowcase.exception.AccessDeniedBusinessException;
import com.modularshowcase.model.UserEntity;
import com.modularshowcase.security.JwtTokenProvider;
import com.modularshowcase.security.UserPrincipal;

@Service
public class AuthService {

    private final UserService userService;
    private final JwtTokenProvider jwtTokenProvider;
    private final PasswordEncoder passwordEncoder;

    public AuthService(UserService userService, JwtTokenProvider jwtTokenProvider, PasswordEncoder passwordEncoder) {
        this.userService = userService;
        this.jwtTokenProvider = jwtTokenProvider;
        this.passwordEncoder = passwordEncoder;
    }

    public AuthResponse issueToken(@NonNull AuthRequest request) {
        UserEntity user = userService.findByEmail(Objects.requireNonNull(request.email(), "email must not be null"));

        String rawPassword = request.password();
        if (rawPassword == null || rawPassword.isBlank()) {
            throw new AccessDeniedBusinessException("Password is required for authentication.");
        }

        String storedHash = user.getPasswordHash();
        if (storedHash == null || !passwordEncoder.matches(rawPassword, storedHash)) {
            throw new AccessDeniedBusinessException("Invalid credentials.");
        }

        if (!user.getRole().equalsIgnoreCase(request.role())) {
            throw new AccessDeniedBusinessException("Requested role does not match persisted user role.");
        }

        UserPrincipal principal = new UserPrincipal(user.getUserId(), user.getEmail(), user.getRole());
        return responseFor(user, principal);
    }

    public AuthResponse refreshToken(@NonNull AuthRefreshRequest request) {
        String refreshToken = Objects.requireNonNull(request.refreshToken(), "refreshToken must not be null");
        if (!jwtTokenProvider.validateRefreshToken(refreshToken)) {
            throw new AccessDeniedBusinessException("Invalid refresh token.");
        }

        UserEntity user = userService.findByEmail(jwtTokenProvider.extractUsername(refreshToken));
        UserPrincipal principal = new UserPrincipal(user.getUserId(), user.getEmail(), user.getRole());
        return responseFor(user, principal);
    }

    private AuthResponse responseFor(UserEntity user, UserPrincipal principal) {
        String accessToken = jwtTokenProvider.generateAccessToken(principal);
        String refreshToken = jwtTokenProvider.generateRefreshToken(principal);
        UserResponse userResponse = new UserResponse(
                user.getUserId(),
                user.getName(),
                user.getFullName(),
                user.getEmail(),
                user.getPhone(),
                user.getRole()
        );
        return new AuthResponse(accessToken, refreshToken, "Bearer", jwtTokenProvider.getExpirationMs(), userResponse);
    }
}
