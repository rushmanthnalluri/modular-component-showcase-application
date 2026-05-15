package com.modularshowcase;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

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

    @Test
    void issueTokenUsesPersistedRoleWithoutMutatingUser() {
        UserEntity user = user("developer");
        when(userService.findByEmail("dev@example.com")).thenReturn(user);
        when(jwtTokenProvider.generateToken(org.mockito.ArgumentMatchers.any())).thenReturn("token");
        when(jwtTokenProvider.getExpirationMs()).thenReturn(3600000L);

        AuthService authService = new AuthService(userService, jwtTokenProvider);
        AuthResponse response = authService.issueToken(new AuthRequest("dev@example.com", "developer"));

        assertThat(response.accessToken()).isEqualTo("token");
        assertThat(response.user().role()).isEqualTo("developer");
        assertThat(user.getRole()).isEqualTo("developer");
    }

    @Test
    void issueTokenRejectsRequestedRoleEscalation() {
        when(userService.findByEmail("user@example.com")).thenReturn(user("user"));

        AuthService authService = new AuthService(userService, jwtTokenProvider);

        assertThatThrownBy(() -> authService.issueToken(new AuthRequest("user@example.com", "admin")))
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
        return user;
    }
}
