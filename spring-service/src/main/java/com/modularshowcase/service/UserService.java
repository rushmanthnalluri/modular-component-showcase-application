package com.modularshowcase.service;

import java.util.List;
import java.util.Objects;

import org.springframework.lang.NonNull;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.modularshowcase.dto.UserRequest;
import com.modularshowcase.dto.UserResponse;
import com.modularshowcase.exception.ResourceNotFoundException;
import com.modularshowcase.model.UserEntity;
import com.modularshowcase.repository.UserRepository;

@Service
@SuppressWarnings("null")
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public UserService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public List<UserResponse> getAll() {
        return userRepository.findAll().stream().map(this::toResponse).toList();
    }

    public UserResponse getById(@NonNull Long userId) {
        return toResponse(findEntity(userId));
    }

    public UserResponse create(@NonNull UserRequest request) {
        UserEntity entity = new UserEntity();
        mapRequest(request, entity);
        return toResponse(Objects.requireNonNull(userRepository.save(entity), "Saved user must not be null"));
    }

    public UserResponse update(@NonNull Long userId, @NonNull UserRequest request) {
        UserEntity entity = findEntity(userId);
        mapRequest(request, entity);
        return toResponse(Objects.requireNonNull(userRepository.save(entity), "Saved user must not be null"));
    }

    public void delete(@NonNull Long userId) {
        UserEntity entity = findEntity(userId);
        userRepository.delete(entity);
    }

    @NonNull
    public UserEntity findByEmail(@NonNull String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found for email: " + email));
    }

    @NonNull
    private UserEntity findEntity(@NonNull Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id=" + userId));
    }

    private void mapRequest(@NonNull UserRequest request, @NonNull UserEntity entity) {
        entity.setName(request.name());
        entity.setFullName(request.fullName());
        entity.setEmail(request.email());
        entity.setPhone(request.phone());
        entity.setRole(request.role().trim().toLowerCase());
        if (request.password() != null && !request.password().isBlank()) {
            entity.setPasswordHash(passwordEncoder.encode(request.password()));
        }
    }

    private UserResponse toResponse(@NonNull UserEntity entity) {
        return new UserResponse(
                Objects.requireNonNull(entity.getUserId(), "User id must not be null"),
                entity.getName(),
                entity.getFullName(),
                entity.getEmail(),
                entity.getPhone(),
                entity.getRole()
        );
    }
}
