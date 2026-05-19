package com.modularshowcase;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

import com.modularshowcase.dto.AuthRefreshRequest;
import com.modularshowcase.dto.AuthRequest;
import com.modularshowcase.dto.AuthResponse;
import com.modularshowcase.exception.AccessDeniedBusinessException;
import com.modularshowcase.model.UserEntity;
import com.modularshowcase.security.JwtTokenProvider;
import com.modularshowcase.service.AuthService;
import com.modularshowcase.service.UserService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserService userService;

    @Mock
    private JwtTokenProvider jwtTokenProvider;

    @Mock
    private org.springframework.security.crypto.password.PasswordEncoder passwordEncoder;

    @Test
    void issueTokenUsesPersistedRoleWithoutMutatingUser() {
        UserEntity user = user("developer");
        when(userService.findByEmail("dev@example.com")).thenReturn(user);
        when(passwordEncoder.matches(org.mockito.ArgumentMatchers.anyString(), org.mockito.ArgumentMatchers.anyString())).thenReturn(true);
        when(jwtTokenProvider.generateAccessToken(org.mockito.ArgumentMatchers.any())).thenReturn("access-token");
        when(jwtTokenProvider.generateRefreshToken(org.mockito.ArgumentMatchers.any())).thenReturn("refresh-token");
        when(jwtTokenProvider.getExpirationMs()).thenReturn(3600000L);

        AuthService authService = new AuthService(userService, jwtTokenProvider, passwordEncoder);
        AuthResponse response = authService.issueToken(new AuthRequest("dev@example.com", "developer", "Password123!"));

        assertThat(response.accessToken()).isEqualTo("access-token");
        assertThat(response.refreshToken()).isEqualTo("refresh-token");
        assertThat(response.user().role()).isEqualTo("developer");
        assertThat(user.getRole()).isEqualTo("developer");
    }

    @Test
    void refreshTokenIssuesNewTokenPair() {
        UserEntity user = user("user");
        when(jwtTokenProvider.validateRefreshToken("refresh-token")).thenReturn(true);
        when(jwtTokenProvider.extractUsername("refresh-token")).thenReturn("user@example.com");
        when(userService.findByEmail("user@example.com")).thenReturn(user);
        when(jwtTokenProvider.generateAccessToken(org.mockito.ArgumentMatchers.any())).thenReturn("new-access-token");
        when(jwtTokenProvider.generateRefreshToken(org.mockito.ArgumentMatchers.any())).thenReturn("new-refresh-token");
        when(jwtTokenProvider.getExpirationMs()).thenReturn(3600000L);

        AuthService authService = new AuthService(userService, jwtTokenProvider, passwordEncoder);
        AuthResponse response = authService.refreshToken(new AuthRefreshRequest("refresh-token"));

        assertThat(response.accessToken()).isEqualTo("new-access-token");
        assertThat(response.refreshToken()).isEqualTo("new-refresh-token");
        assertThat(response.user().email()).isEqualTo("user@example.com");
    }

    @Test
    void issueTokenRejectsRequestedRoleEscalation() {
        when(userService.findByEmail("user@example.com")).thenReturn(user("user"));

        AuthService authService = new AuthService(userService, jwtTokenProvider, passwordEncoder);

        assertThatThrownBy(() -> authService.issueToken(new AuthRequest("user@example.com", "admin", "Password123!")))
                .isInstanceOf(AccessDeniedBusinessException.class);
    }

    private UserEntity user(String role) {
        UserEntity user = new UserEntity();
        user.setUserId(1L);
        user.setName("Test User");
        user.setFullName("Test User");
        user.setEmail(role + "@example.com");
        user.setPhone("1234567890");
        user.setRole(role);
        user.setPasswordHash("$2a$10$u9G0iO5Y5t7eWwqPf1rqU.yNDwOnG9m73u9kH42AtPfy3ZVplgDk.");
        return user;
    }
}
