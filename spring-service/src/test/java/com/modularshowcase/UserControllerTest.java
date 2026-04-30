package com.modularshowcase;

import java.util.List;

import org.junit.jupiter.api.Test;
import static org.mockito.Mockito.when;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.modularshowcase.config.TestSecurityConfig;
import com.modularshowcase.controller.UserController;
import com.modularshowcase.dto.UserResponse;
import com.modularshowcase.metrics.RequestMetricsRecorder;
import com.modularshowcase.security.CustomUserDetailsService;
import com.modularshowcase.security.JwtTokenProvider;
import com.modularshowcase.service.UserService;

@WebMvcTest(UserController.class)
@AutoConfigureMockMvc(addFilters = false)
@Import(TestSecurityConfig.class)
class UserControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @SuppressWarnings("all")
    @MockitoBean
    private UserService userService;

    @SuppressWarnings("unused")
    @MockitoBean
    private RequestMetricsRecorder requestMetricsRecorder;

    @SuppressWarnings("unused")
    @MockitoBean
    private JwtTokenProvider jwtTokenProvider;

    @SuppressWarnings("unused")
    @MockitoBean
    private CustomUserDetailsService customUserDetailsService;

    @Test
    void listUsersReturnsPayload() throws Exception {
        when(userService.getAll()).thenReturn(List.of(
                new UserResponse(1L, "Controller", "Controller User", "controller@example.com", "1234567890", "admin")
        ));

        mockMvc.perform(get("/spring/users"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].email").value("controller@example.com"));
    }
}
