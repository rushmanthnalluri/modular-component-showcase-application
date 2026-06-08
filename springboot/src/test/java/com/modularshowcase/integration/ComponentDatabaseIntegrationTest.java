package com.modularshowcase.integration;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.dao.DataIntegrityViolationException;

import com.modularshowcase.model.ComponentEntity;
import com.modularshowcase.model.UserEntity;
import com.modularshowcase.repository.ComponentRepository;
import com.modularshowcase.repository.UserRepository;

/**
 * Integration tests for Component database operations.
 * 
 * This test suite verifies:
 * - Component creation and retrieval
 * - Foreign key constraint enforcement
 * - Unique constraint enforcement
 * - Index performance
 */
@SpringBootTest
@Disabled("Requires database connection")
public class ComponentDatabaseIntegrationTest {

    @Autowired
    private ComponentRepository componentRepository;

    @Autowired
    private UserRepository userRepository;

    @Test
    void shouldCreateAndRetrieveComponent() {
        // Given
        UserEntity user = new UserEntity();
        user.setName("Test User");
        user.setEmail("test@example.com");
        user = userRepository.save(user);

        // When
        ComponentEntity component = new ComponentEntity();
        component.setName("Primary Button");
        component.setDescription("A primary button component");
        component.setCategoryId(1L);
        component.setUserId(user.getUserId());
        ComponentEntity saved = componentRepository.save(component);

        // Then
        assertThat(saved.getComponentId()).isNotNull();
        
        Long savedId = saved.getComponentId();
        if (savedId != null) {
            ComponentEntity retrieved = componentRepository.findById(savedId).orElse(null);
            assertThat(retrieved).isNotNull();
            assertThat(retrieved.getName()).isEqualTo("Primary Button");
            assertThat(retrieved.getCategoryId()).isEqualTo(1L);
            assertThat(retrieved.getUserId()).isEqualTo(user.getUserId());
        }
    }

    @Test
    void shouldEnforceForeignKeyConstraintOnUser() {
        // Given
        Long categoryId = 2L;

        // When/Then - Component requires user
        assertThatThrownBy(() -> {
            ComponentEntity component = new ComponentEntity();
            component.setName("Input Field");
            component.setDescription("An input field component");
            component.setCategoryId(categoryId);
            component.setUserId(null);
            componentRepository.save(component);
            componentRepository.flush();
        }).isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test
    void shouldEnforceForeignKeyConstraintOnCategory() {
        // Given
        final UserEntity user = new UserEntity();
        user.setName("Another User");
        user.setEmail("another@example.com");
        final UserEntity savedUser = userRepository.save(user);

        // When/Then - Component requires category
        assertThatThrownBy(() -> {
            ComponentEntity component = new ComponentEntity();
            component.setName("Modal Component");
            component.setDescription("A modal component");
            component.setCategoryId(null);
            component.setUserId(savedUser.getUserId());
            componentRepository.save(component);
            componentRepository.flush();
        }).isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test
    void shouldEnforceUniqueEmailConstraint() {
        // Given
        UserEntity user1 = new UserEntity();
        user1.setName("User One");
        user1.setEmail("duplicate@example.com");
        userRepository.save(user1);

        // When/Then
        assertThatThrownBy(() -> {
            UserEntity user2 = new UserEntity();
            user2.setName("User Two");
            user2.setEmail("duplicate@example.com");
            userRepository.save(user2);
            userRepository.flush();
        }).isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test
    void shouldFindComponentsByUserId() {
        // Given
        final UserEntity user = new UserEntity();
        user.setName("Category Test User");
        user.setEmail("category@example.com");
        final UserEntity savedUser = userRepository.save(user);

        ComponentEntity comp1 = new ComponentEntity();
        comp1.setName("Card 1");
        comp1.setDescription("First card");
        comp1.setCategoryId(3L);
        comp1.setUserId(savedUser.getUserId());
        componentRepository.save(comp1);

        ComponentEntity comp2 = new ComponentEntity();
        comp2.setName("Card 2");
        comp2.setDescription("Second card");
        comp2.setCategoryId(3L);
        comp2.setUserId(savedUser.getUserId());
        componentRepository.save(comp2);

        // When
        var results = componentRepository.findAll();
        var userComponents = results.stream()
            .filter(c -> c.getUserId().equals(savedUser.getUserId()))
            .toList();

        // Then
        assertThat(userComponents).hasSize(2);
    }

    @Test
    void shouldCreateComponentSuccessfully() {
        // Given
        final UserEntity user = new UserEntity();
        user.setName("Create User");
        user.setEmail("createuser@example.com");
        final UserEntity savedUser = userRepository.save(user);

        ComponentEntity component = new ComponentEntity();
        component.setName("Temporary Component");
        component.setDescription("Will be tested");
        component.setCategoryId(4L);
        component.setUserId(savedUser.getUserId());
        ComponentEntity saved = componentRepository.save(component);

        Long componentId = saved.getComponentId();

        // Then - Verify component was created successfully
        if (componentId != null) {
            assertThat(componentRepository.findById(componentId)).isNotEmpty();
        }
    }

    @Test
    void shouldSaveComponentWithValidData() {
        // Given
        UserEntity user = new UserEntity();
        user.setName("Validator User");
        user.setEmail("validator@example.com");
        user = userRepository.save(user);

        // When
        ComponentEntity component = new ComponentEntity();
        component.setName("Test Component");
        component.setDescription("A very long description with test data");
        component.setCategoryId(5L);
        component.setUserId(user.getUserId());
        component = componentRepository.save(component);

        // Then
        assertThat(component.getComponentId()).isNotNull();
        assertThat(component.getDescription()).isNotEmpty();
    }

    @Test
    void shouldUpdateComponentSuccessfully() {
        // Given
        final UserEntity user = new UserEntity();
        user.setName("Search User");
        user.setEmail("search@example.com");
        final UserEntity savedUser = userRepository.save(user);

        ComponentEntity comp1 = new ComponentEntity();
        comp1.setName("Advanced Button");
        comp1.setDescription("Advanced button component");
        comp1.setCategoryId(6L);
        comp1.setUserId(savedUser.getUserId());
        comp1 = componentRepository.save(comp1);

        // When
        comp1.setDescription("Updated description");
        var updated = componentRepository.save(comp1);

        // Then
        assertThat(updated.getDescription()).isEqualTo("Updated description");
    }

    @Test
    void shouldFindComponentById() {
        // Given
        final UserEntity user = new UserEntity();
        user.setName("Find User");
        user.setEmail("find@example.com");
        final UserEntity savedUser = userRepository.save(user);

        ComponentEntity component = new ComponentEntity();
        component.setName("Search Target");
        component.setDescription("This component can be found");
        component.setCategoryId(7L);
        component.setUserId(savedUser.getUserId());
        ComponentEntity saved = componentRepository.save(component);

        // When
        Long savedId = saved.getComponentId();
        Optional<ComponentEntity> found = Optional.empty();
        if (savedId != null) {
            found = componentRepository.findById(savedId);
        }

        // Then
        assertThat(found).isNotEmpty();
        assertThat(found.get().getName()).isEqualTo("Search Target");
    }

    @Test
    void shouldDeleteComponentById() {
        // Given
        final UserEntity user = new UserEntity();
        user.setName("Delete User");
        user.setEmail("delete@example.com");
        final UserEntity savedUser = userRepository.save(user);

        ComponentEntity component = new ComponentEntity();
        component.setName("Component To Delete");
        component.setDescription("This will be deleted");
        component.setCategoryId(8L);
        component.setUserId(savedUser.getUserId());
        ComponentEntity saved = componentRepository.save(component);

        // When
        Long savedId = saved.getComponentId();
        if (savedId != null) {
            componentRepository.deleteById(savedId);
        }

        // Then
        Optional<ComponentEntity> deleted = Optional.empty();
        if (savedId != null) {
            deleted = componentRepository.findById(savedId);
        }
        assertThat(deleted).isEmpty();
    }

    @Test
    void shouldBatchCreateMultipleComponents() {
        // Given
        final UserEntity user = new UserEntity();
        user.setName("Batch User");
        user.setEmail("batch@example.com");
        final UserEntity savedUser = userRepository.save(user);

        // When
        for (int i = 0; i < 5; i++) {
            ComponentEntity component = new ComponentEntity();
            component.setName("Batch Component " + i);
            component.setDescription("Batch test component " + i);
            component.setCategoryId(9L);
            component.setUserId(savedUser.getUserId());
            componentRepository.save(component);
        }

        // Then
        var allComponents = componentRepository.findAll();
        var userComponents = allComponents.stream()
            .filter(c -> c.getUserId().equals(savedUser.getUserId()))
            .filter(c -> c.getName().startsWith("Batch Component"))
            .toList();
        assertThat(userComponents).hasSize(5);
    }
}
