package com.modularshowcase.config;

import org.springframework.boot.test.context.TestConfiguration;

/**
 * Test configuration for test slices.
 * JwtTokenProvider is now annotated with @Component and will be automatically scanned.
 * This configuration is kept for potential future test configuration needs.
 */
@TestConfiguration
public class TestSecurityConfig {
    // JwtTokenProvider is now provided via @Component scanning
}
