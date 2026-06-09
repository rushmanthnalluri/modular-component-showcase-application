package com.modularshowcase.service;

import com.modularshowcase.dto.DiscussionRequest;
import com.modularshowcase.dto.DiscussionResponse;
import com.modularshowcase.exception.ResourceNotFoundException;
import com.modularshowcase.model.DiscussionEntity;
import com.modularshowcase.repository.DiscussionRepository;
import java.util.List;
import java.util.Objects;
import java.util.UUID;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@SuppressWarnings("null")
public class DiscussionService {

    private final DiscussionRepository discussionRepository;

    public DiscussionService(DiscussionRepository discussionRepository) {
        this.discussionRepository = discussionRepository;
    }

    public List<DiscussionResponse> getAll(String componentMongoId) {
        if (componentMongoId != null && !componentMongoId.isBlank()) {
            return discussionRepository.findByComponentMongoIdOrderByDiscussionIdDesc(componentMongoId.trim())
                    .stream()
                    .map(this::toResponse)
                    .toList();
        }
        return discussionRepository.findAll().stream().map(this::toResponse).toList();
    }

    public DiscussionResponse getById(@NonNull Long discussionId) {
        return toResponse(findEntity(discussionId));
    }

    @Transactional
    public DiscussionResponse create(@NonNull DiscussionRequest request) {
        DiscussionEntity entity = new DiscussionEntity();
        mapRequest(request, entity);
        entity.setMongoDiscussionId("spring-discussion-" + UUID.randomUUID());
        return toResponse(Objects.requireNonNull(discussionRepository.save(entity), "Saved discussion must not be null"));
    }

    @Transactional
    public DiscussionResponse update(@NonNull Long discussionId, @NonNull DiscussionRequest request) {
        DiscussionEntity entity = findEntity(discussionId);
        mapRequest(request, entity);
        return toResponse(Objects.requireNonNull(discussionRepository.save(entity), "Saved discussion must not be null"));
    }

    @Transactional
    public void delete(@NonNull Long discussionId) {
        discussionRepository.delete(findEntity(discussionId));
    }

    @NonNull
    private DiscussionEntity findEntity(@NonNull Long discussionId) {
        return discussionRepository.findById(discussionId)
                .orElseThrow(() -> new ResourceNotFoundException("Discussion not found with id=" + discussionId));
    }

    private void mapRequest(@NonNull DiscussionRequest request, @NonNull DiscussionEntity entity) {
        entity.setUserId(request.userId());
        entity.setMongoUserId(request.mongoUserId());
        entity.setComponentMongoId(request.componentMongoId());
        entity.setParentMongoId(blankToNull(request.parentMongoId()));
        entity.setMessage(request.message());
        entity.setLikes(request.likes());
        entity.setStatus(request.status() == null || request.status().isBlank() ? "active" : request.status().toLowerCase());
    }

    private String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private DiscussionResponse toResponse(@NonNull DiscussionEntity entity) {
        return new DiscussionResponse(
                Objects.requireNonNull(entity.getDiscussionId(), "Discussion id must not be null"),
                entity.getMongoDiscussionId(),
                Objects.requireNonNull(entity.getUserId(), "User id must not be null"),
                entity.getMongoUserId(),
                entity.getComponentMongoId(),
                entity.getParentMongoId(),
                entity.getMessage(),
                entity.getLikes() == null ? 0 : entity.getLikes(),
                entity.getStatus()
        );
    }
}
