package com.modularshowcase.service;

import com.modularshowcase.dto.AuthRequest;
import com.modularshowcase.dto.AuthResponse;
import com.modularshowcase.dto.UserResponse;
import com.modularshowcase.model.UserEntity;
import com.modularshowcase.security.JwtTokenProvider;
import com.modularshowcase.security.UserPrincipal;
import java.util.Objects;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    private final UserService userService;
    private final JwtTokenProvider jwtTokenProvider;

    public AuthService(UserService userService, JwtTokenProvider jwtTokenProvider) {
        this.userService = userService;
        this.jwtTokenProvider = jwtTokenProvider;
    }

    public AuthResponse issueToken(@NonNull AuthRequest request) {
        UserEntity user = userService.findByEmail(Objects.requireNonNull(request.email(), "email must not be null"));
        if (!user.getRole().equalsIgnoreCase(request.role())) {
            user.setRole(request.role().toLowerCase());
        }
        UserPrincipal principal = new UserPrincipal(user.getUserId(), user.getEmail(), user.getRole());
        String token = jwtTokenProvider.generateToken(principal);
        UserResponse userResponse = new UserResponse(
                user.getUserId(),
                user.getName(),
                user.getFullName(),
                user.getEmail(),
                user.getPhone(),
                user.getRole()
        );
        return new AuthResponse(token, "Bearer", jwtTokenProvider.getExpirationMs(), userResponse);
    }
}
