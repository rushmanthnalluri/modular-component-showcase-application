package com.modularshowcase;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.modularshowcase.config.TestSecurityConfig;
import com.modularshowcase.controller.DiscussionController;
import com.modularshowcase.dto.DiscussionResponse;
import com.modularshowcase.metrics.RequestMetricsRecorder;
import com.modularshowcase.security.JwtAuthenticationFilter;
import com.modularshowcase.service.DiscussionService;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(DiscussionController.class)
@AutoConfigureMockMvc(addFilters = false)
@Import(TestSecurityConfig.class)
class DiscussionControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private DiscussionService discussionService;

    @MockitoBean
    private RequestMetricsRecorder requestMetricsRecorder;

    @MockitoBean
    private JwtAuthenticationFilter jwtAuthenticationFilter;

    @Test
    void listDiscussionsSupportsComponentFilter() throws Exception {
        when(discussionService.getAll("component-1")).thenReturn(List.of(
                new DiscussionResponse(
                        1L,
                        "spring-discussion-1",
                        7L,
                        "mongo-user-7",
                        "component-1",
                        null,
                        "Does this support keyboard navigation?",
                        0,
                        "active"
                )
        ));

        mockMvc.perform(get("/spring/discussions").param("componentMongoId", "component-1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].componentMongoId").value("component-1"))
                .andExpect(jsonPath("$[0].message").value("Does this support keyboard navigation?"));
    }
}
