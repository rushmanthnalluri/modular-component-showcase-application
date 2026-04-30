package com.modularshowcase.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

import com.modularshowcase.security.JwtAuthenticationFilter;

@Configuration
@EnableMethodSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http, JwtAuthenticationFilter jwtAuthenticationFilter) throws Exception {
        http
                .csrf(csrf -> csrf.disable())
                .cors(cors -> {})
                .headers(headers -> headers
                        .frameOptions(frameOptions -> frameOptions.deny())
                        .contentTypeOptions(contentTypeOptions -> {})
                        .httpStrictTransportSecurity(hsts -> hsts.includeSubDomains(true).maxAgeInSeconds(31536000)))
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/spring/auth/**", "/actuator/health/**", "/actuator/prometheus", "/v3/api-docs/**", "/swagger-ui/**", "/swagger-ui.html").permitAll()
                        .requestMatchers("/spring/admin/**").hasRole("ADMIN")
                        .requestMatchers("/spring/developer/**").hasAnyRole("DEVELOPER", "ADMIN")
                        .requestMatchers("/spring/**").authenticated()
                        .anyRequest().permitAll()
                )
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
