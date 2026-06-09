package com.modularshowcase;

import java.util.Objects;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import static org.mockito.Mockito.when;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import com.modularshowcase.dto.UserRequest;
import com.modularshowcase.dto.UserResponse;
import com.modularshowcase.model.UserEntity;
import com.modularshowcase.repository.UserRepository;
import com.modularshowcase.service.UserService;

@ExtendWith(MockitoExtension.class)
@SuppressWarnings("null")
class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private UserService userService;

    @Test
    void getByIdReturnsMappedUser() {
        UserEntity user = new UserEntity();
        user.setUserId(1L);
        user.setName("Service User");
        user.setFullName("Service User");
        user.setEmail("service.user@example.com");
        user.setPhone("1234567890");
        user.setRole("user");

        when(userRepository.findById(1L)).thenReturn(Optional.of(user));

        UserResponse response = userService.getById(1L);
        assertThat(response.email()).isEqualTo("service.user@example.com");
    }

    @Test
    void createPersistsUser() {
        UserRequest request = new UserRequest("Create", "Create User", "create.user@example.com", "1234567890", "user", "Password123!");
        UserEntity saved = new UserEntity();
        saved.setUserId(2L);
        saved.setName(request.name());
        saved.setFullName(request.fullName());
        saved.setEmail(request.email());
        saved.setPhone(request.phone());
        saved.setRole(request.role());
        saved.setPasswordHash("encoded-password");

        when(passwordEncoder.encode("Password123!")).thenReturn("encoded-password");
        when(userRepository.save(org.mockito.ArgumentMatchers.any(UserEntity.class)))
            .thenReturn(Objects.requireNonNull(saved));

        UserResponse response = userService.create(request);
        assertThat(response.userId()).isEqualTo(2L);
    }
}
