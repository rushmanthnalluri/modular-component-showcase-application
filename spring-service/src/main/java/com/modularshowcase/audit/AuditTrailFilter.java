package com.modularshowcase.audit;

import java.io.IOException;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import com.modularshowcase.metrics.RequestMetricsRecorder;

import io.micrometer.core.instrument.Timer;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@Component
public class AuditTrailFilter extends OncePerRequestFilter {

    private static final Logger LOGGER = LoggerFactory.getLogger(AuditTrailFilter.class);
    private final RequestMetricsRecorder requestMetricsRecorder;

    public AuditTrailFilter(RequestMetricsRecorder requestMetricsRecorder) {
        this.requestMetricsRecorder = requestMetricsRecorder;
    }

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request,
                                    @NonNull HttpServletResponse response,
                                    @NonNull FilterChain filterChain) throws ServletException, IOException {
        requestMetricsRecorder.incrementRequests();
        Timer.Sample sample = requestMetricsRecorder.startLatencySample();

        try {
            filterChain.doFilter(request, response);
        } finally {
            requestMetricsRecorder.stopLatencySample(sample);
            if (response.getStatus() >= 500) {
                requestMetricsRecorder.incrementErrors();
            }
            LOGGER.info("audit_event method={} path={} status={}", request.getMethod(), request.getRequestURI(), response.getStatus());
        }
    }
}
