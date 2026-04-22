package com.modularshowcase.controller;

import com.modularshowcase.dto.AuthRequest;
import com.modularshowcase.dto.AuthResponse;
import com.modularshowcase.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.lang.NonNull;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/spring/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/token")
    public AuthResponse issueToken(@Valid @RequestBody @NonNull AuthRequest request) {
        return authService.issueToken(request);
    }
}
