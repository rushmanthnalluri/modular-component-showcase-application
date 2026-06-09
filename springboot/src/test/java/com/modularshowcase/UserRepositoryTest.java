package com.modularshowcase;

import static org.assertj.core.api.Assertions.assertThat;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.test.context.ActiveProfiles;

import com.modularshowcase.model.UserEntity;
import com.modularshowcase.repository.UserRepository;

@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.ANY)
@ActiveProfiles("test")
class UserRepositoryTest {

    @Autowired
    private UserRepository userRepository;

    @Test
    void findByEmailReturnsUser() {
        UserEntity user = new UserEntity();
        user.setName("Repo User");
        user.setFullName("Repo User");
        user.setEmail("repo.user@example.com");
        user.setPhone("1234567890");
        user.setRole("user");
        userRepository.save(user);

        assertThat(userRepository.findByEmail("repo.user@example.com")).isPresent();
    }
}
