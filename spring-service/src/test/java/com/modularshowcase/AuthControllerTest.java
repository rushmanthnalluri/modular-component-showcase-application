package com.modularshowcase;

import java.util.Objects;

import org.junit.jupiter.api.Test;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.modularshowcase.controller.AuthController;
import com.modularshowcase.dto.AuthRequest;
import com.modularshowcase.dto.AuthResponse;
import com.modularshowcase.dto.UserResponse;
import com.modularshowcase.metrics.RequestMetricsRecorder;
import com.modularshowcase.security.JwtAuthenticationFilter;
import com.modularshowcase.service.AuthService;

@WebMvcTest(AuthController.class)
@AutoConfigureMockMvc(addFilters = false)
class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private AuthService authService;

    @MockitoBean
    private JwtAuthenticationFilter jwtAuthenticationFilter;

    @MockitoBean
    private RequestMetricsRecorder requestMetricsRecorder;

    @Test
    @SuppressWarnings("null")
    void tokenEndpointReturnsJwtPayload() throws Exception {
        AuthResponse response = new AuthResponse(
                "signed-jwt-token",
                "Bearer",
                3_600_000L,
                new UserResponse(7L, "Verifier", "Verifier User", "verifier@example.com", "1234567890", "admin")
        );

        when(authService.issueToken(any(AuthRequest.class))).thenReturn(response);

        mockMvc.perform(post("/spring/auth/token")
                .contentType(Objects.requireNonNull(MediaType.APPLICATION_JSON))
                .content(Objects.requireNonNull(objectMapper.writeValueAsString(
                    new AuthRequest("verifier@example.com", "admin")))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").value("signed-jwt-token"))
                .andExpect(jsonPath("$.tokenType").value("Bearer"))
                .andExpect(jsonPath("$.user.email").value("verifier@example.com"));
    }
}
