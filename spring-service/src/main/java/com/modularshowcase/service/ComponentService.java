package com.modularshowcase.service;

import com.modularshowcase.dto.ComponentRequest;
import com.modularshowcase.dto.ComponentResponse;
import com.modularshowcase.dto.ComponentSearchResponse;
import com.modularshowcase.exception.ResourceNotFoundException;
import com.modularshowcase.model.ComponentEntity;
import com.modularshowcase.repository.ComponentRepository;
import com.modularshowcase.specification.ComponentSpecifications;
import java.util.List;
import java.util.Objects;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Service;

@Service
@SuppressWarnings("null")
public class ComponentService {

    private final ComponentRepository componentRepository;

    public ComponentService(ComponentRepository componentRepository) {
        this.componentRepository = componentRepository;
    }

    public List<ComponentResponse> getAll() {
        return componentRepository.findAll().stream().map(this::toResponse).toList();
    }

        public ComponentSearchResponse search(String name, Long categoryId, Long userId, int page, int size, String sortBy,
            String direction) {
        Sort.Direction safeDirection = "desc".equalsIgnoreCase(direction) ? Sort.Direction.DESC : Sort.Direction.ASC;
        String safeSortBy = switch (sortBy) {
            case "name", "description", "categoryId", "userId", "componentId" -> sortBy;
            default -> "componentId";
        };

        Specification<ComponentEntity> specification = Specification.allOf(
            ComponentSpecifications.nameContains(name),
            ComponentSpecifications.categoryEquals(categoryId),
            ComponentSpecifications.userEquals(userId)
        );

        Page<ComponentEntity> resultPage = componentRepository.findAll(
                specification,
                PageRequest.of(Math.max(page, 0), Math.max(1, Math.min(size, 100)), Sort.by(safeDirection, safeSortBy))
        );

        return new ComponentSearchResponse(
                resultPage.getContent().stream().map(this::toResponse).toList(),
                resultPage.getTotalElements(),
                resultPage.getTotalPages(),
                resultPage.getNumber(),
                resultPage.getSize(),
                safeSortBy,
                safeDirection.name().toLowerCase()
        );
    }

    public ComponentResponse getById(@NonNull Long componentId) {
        return toResponse(findEntity(componentId));
    }

    public ComponentResponse create(@NonNull ComponentRequest request) {
        ComponentEntity entity = new ComponentEntity();
        mapRequest(request, entity);
        return toResponse(Objects.requireNonNull(componentRepository.save(entity), "Saved component must not be null"));
    }

    public ComponentResponse update(@NonNull Long componentId, @NonNull ComponentRequest request) {
        ComponentEntity entity = findEntity(componentId);
        mapRequest(request, entity);
        return toResponse(Objects.requireNonNull(componentRepository.save(entity), "Saved component must not be null"));
    }

    public void delete(@NonNull Long componentId) {
        componentRepository.delete(findEntity(componentId));
    }

    @NonNull
    private ComponentEntity findEntity(@NonNull Long componentId) {
        return componentRepository.findById(componentId)
                .orElseThrow(() -> new ResourceNotFoundException("Component not found with id=" + componentId));
    }

    private void mapRequest(@NonNull ComponentRequest request, @NonNull ComponentEntity entity) {
        entity.setName(request.name());
        entity.setDescription(request.description());
        entity.setCategoryId(request.categoryId());
        entity.setUserId(request.userId());
    }

    private ComponentResponse toResponse(@NonNull ComponentEntity entity) {
        return new ComponentResponse(
                Objects.requireNonNull(entity.getComponentId(), "Component id must not be null"),
                entity.getName(),
                entity.getDescription(),
                Objects.requireNonNull(entity.getCategoryId(), "Category id must not be null"),
                Objects.requireNonNull(entity.getUserId(), "User id must not be null")
        );
    }
}
