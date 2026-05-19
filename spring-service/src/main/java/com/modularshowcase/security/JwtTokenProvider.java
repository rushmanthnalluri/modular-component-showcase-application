package com.modularshowcase.security;

import java.nio.charset.StandardCharsets;
import java.util.Date;

import javax.crypto.SecretKey;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jws;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;

@Component
public class JwtTokenProvider {

    private final SecretKey signingKey;
    private final long expirationMs;
    private final long refreshExpirationMs;

    public JwtTokenProvider(
            @Value("${app.jwt.secret}") String secret,
            @Value("${app.jwt.expiration-ms}") long expirationMs,
            @Value("${app.jwt.refresh-expiration-ms}") long refreshExpirationMs
    ) {
        if (secret == null || secret.getBytes(StandardCharsets.UTF_8).length < 32) {
            throw new IllegalArgumentException("app.jwt.secret must be at least 32 UTF-8 bytes for HS256 signing.");
        }
        this.signingKey = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.expirationMs = expirationMs;
        this.refreshExpirationMs = refreshExpirationMs;
    }

    public String generateToken(UserPrincipal principal) {
        return generateAccessToken(principal);
    }

    public String generateAccessToken(UserPrincipal principal) {
        return generateToken(principal, expirationMs, "access");
    }

    public String generateRefreshToken(UserPrincipal principal) {
        return generateToken(principal, refreshExpirationMs, "refresh");
    }

    private String generateToken(UserPrincipal principal, long tokenTtlMs, String tokenType) {
        Date now = new Date();
        Date expiry = new Date(now.getTime() + tokenTtlMs);

        return Jwts.builder()
                .subject(principal.getUsername())
                .claim("role", principal.getAuthorities().stream().findFirst().map(Object::toString).orElse("ROLE_USER"))
                .claim("tokenType", tokenType)
                .issuedAt(now)
                .expiration(expiry)
                .signWith(signingKey)
                .compact();
    }

    public String extractUsername(String token) {
        return getClaims(token).getPayload().getSubject();
    }

    public boolean validateToken(String token) {
        return validateAccessToken(token);
    }

    public boolean validateAccessToken(String token) {
        return validateToken(token, "access");
    }

    public boolean validateRefreshToken(String token) {
        return validateToken(token, "refresh");
    }

    private boolean validateToken(String token, String expectedType) {
        try {
            Jws<Claims> claims = getClaims(token);
            Date expiry = claims.getPayload().getExpiration();
            return expiry != null
                    && expiry.after(new Date())
                    && expectedType.equals(claims.getPayload().get("tokenType", String.class));
        } catch (Exception ex) {
            return false;
        }
    }

    public long getExpirationMs() {
        return expirationMs;
    }

    public long getRefreshExpirationMs() {
        return refreshExpirationMs;
    }

    private Jws<Claims> getClaims(String token) {
        return Jwts.parser()
                .verifyWith(signingKey)
                .build()
                .parseSignedClaims(token);
    }
}
