package com.modularshowcase.config;

import java.io.IOException;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.http.HttpStatus;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@Component
public class RateLimitFilter extends OncePerRequestFilter {

    private static final long WINDOW_SECONDS = 60;
    private static final int MAX_REQUESTS_PER_WINDOW = 120;
    private final Map<String, Counter> counters = new ConcurrentHashMap<>();

    @Override
        protected void doFilterInternal(@NonNull HttpServletRequest request, @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain)
            throws ServletException, IOException {
        String path = request.getRequestURI();
        if (path.startsWith("/actuator") || path.startsWith("/swagger-ui") || path.startsWith("/v3/api-docs")) {
            filterChain.doFilter(request, response);
            return;
        }

        String key = resolveClientKey(request);
        Counter counter = counters.computeIfAbsent(key, ignored -> new Counter(Instant.now().getEpochSecond(), 0));

        synchronized (counter) {
            long now = Instant.now().getEpochSecond();
            if ((now - counter.windowStartEpoch) >= WINDOW_SECONDS) {
                counter.windowStartEpoch = now;
                counter.requests = 0;
            }
            counter.requests += 1;
            if (counter.requests > MAX_REQUESTS_PER_WINDOW) {
                response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
                response.setContentType("application/json");
                response.setHeader("X-RateLimit-Limit", String.valueOf(MAX_REQUESTS_PER_WINDOW));
                response.setHeader("X-RateLimit-Remaining", "0");
                response.getWriter().write("{\"message\":\"Rate limit exceeded\"}");
                return;
            }
        }

        response.setHeader("X-RateLimit-Limit", String.valueOf(MAX_REQUESTS_PER_WINDOW));
        response.setHeader("X-RateLimit-Remaining", String.valueOf(Math.max(0, MAX_REQUESTS_PER_WINDOW - counter.requests)));
        filterChain.doFilter(request, response);
    }

    private String resolveClientKey(HttpServletRequest request) {
        String forwardedFor = request.getHeader("X-Forwarded-For");
        if (forwardedFor != null && !forwardedFor.isBlank()) {
            return forwardedFor.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }

    private static final class Counter {
        private long windowStartEpoch;
        private int requests;

        private Counter(long windowStartEpoch, int requests) {
            this.windowStartEpoch = windowStartEpoch;
            this.requests = requests;
        }
    }
}
