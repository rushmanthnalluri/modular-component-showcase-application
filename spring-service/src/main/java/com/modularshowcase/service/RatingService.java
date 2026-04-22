package com.modularshowcase.service;

import java.util.List;
import java.util.Objects;
import java.util.UUID;

import org.springframework.lang.NonNull;
import org.springframework.stereotype.Service;

import com.modularshowcase.dto.RatingRequest;
import com.modularshowcase.dto.RatingResponse;
import com.modularshowcase.exception.ResourceNotFoundException;
import com.modularshowcase.model.RatingEntity;
import com.modularshowcase.repository.RatingRepository;

@Service
@SuppressWarnings("null")
public class RatingService {

    private final RatingRepository ratingRepository;

    public RatingService(RatingRepository ratingRepository) {
        this.ratingRepository = ratingRepository;
    }

    public List<RatingResponse> getAll() {
        return ratingRepository.findAll().stream().map(this::toResponse).toList();
    }

    public RatingResponse getById(@NonNull Long ratingId) {
        return toResponse(findEntity(ratingId));
    }

    public RatingResponse create(@NonNull RatingRequest request) {
        RatingEntity entity = new RatingEntity();
        mapRequest(request, entity);
        entity.setMongoRatingId("spring-rating-" + UUID.randomUUID());
        return toResponse(Objects.requireNonNull(ratingRepository.save(entity), "Saved rating must not be null"));
    }

    public RatingResponse update(@NonNull Long ratingId, @NonNull RatingRequest request) {
        RatingEntity entity = findEntity(ratingId);
        mapRequest(request, entity);
        return toResponse(Objects.requireNonNull(ratingRepository.save(entity), "Saved rating must not be null"));
    }

    public void delete(@NonNull Long ratingId) {
        ratingRepository.delete(findEntity(ratingId));
    }

    @NonNull
    private RatingEntity findEntity(@NonNull Long ratingId) {
        return ratingRepository.findById(ratingId)
                .orElseThrow(() -> new ResourceNotFoundException("Rating not found with id=" + ratingId));
    }

    private void mapRequest(@NonNull RatingRequest request, @NonNull RatingEntity entity) {
        entity.setUserId(request.userId());
        entity.setMongoUserId(request.mongoUserId());
        entity.setComponentMongoId(request.componentMongoId());
        entity.setRating(request.rating());
    }

    private RatingResponse toResponse(@NonNull RatingEntity entity) {
        return new RatingResponse(
                Objects.requireNonNull(entity.getRatingId(), "Rating id must not be null"),
                entity.getMongoRatingId(),
                Objects.requireNonNull(entity.getUserId(), "User id must not be null"),
                entity.getMongoUserId(),
                entity.getComponentMongoId(),
                entity.getRating()
        );
    }
}
