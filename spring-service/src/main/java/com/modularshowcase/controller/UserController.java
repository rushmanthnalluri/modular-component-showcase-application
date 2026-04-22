package com.modularshowcase.controller;

import com.modularshowcase.dto.UserRequest;
import com.modularshowcase.dto.UserResponse;
import com.modularshowcase.service.UserService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.lang.NonNull;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/spring/users")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','DEVELOPER')")
    public List<UserResponse> listUsers() {
        return userService.getAll();
    }

    @GetMapping("/{userId}")
    @PreAuthorize("hasAnyRole('ADMIN','DEVELOPER')")
    public UserResponse getUser(@PathVariable @NonNull Long userId) {
        return userService.getById(userId);
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public UserResponse createUser(@Valid @RequestBody @NonNull UserRequest request) {
        return userService.create(request);
    }

    @PutMapping("/{userId}")
    @PreAuthorize("hasRole('ADMIN')")
    public UserResponse updateUser(@PathVariable @NonNull Long userId,
            @Valid @RequestBody @NonNull UserRequest request) {
        return userService.update(userId, request);
    }

    @DeleteMapping("/{userId}")
    @PreAuthorize("hasRole('ADMIN')")
    public void deleteUser(@PathVariable @NonNull Long userId) {
        userService.delete(userId);
    }
}
