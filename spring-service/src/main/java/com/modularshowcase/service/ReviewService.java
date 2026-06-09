package com.modularshowcase.service;

import java.util.List;
import java.util.Objects;
import java.util.UUID;

import org.springframework.lang.NonNull;
import org.springframework.stereotype.Service;

import com.modularshowcase.dto.ReviewRequest;
import com.modularshowcase.dto.ReviewResponse;
import com.modularshowcase.exception.ResourceNotFoundException;
import com.modularshowcase.model.ReviewEntity;
import com.modularshowcase.repository.ReviewRepository;

@Service
@SuppressWarnings("null")
public class ReviewService {

    private final ReviewRepository reviewRepository;

    public ReviewService(ReviewRepository reviewRepository) {
        this.reviewRepository = reviewRepository;
    }

    public List<ReviewResponse> getAll() {
        return reviewRepository.findAll().stream().map(this::toResponse).toList();
    }

    public ReviewResponse getById(@NonNull Long reviewId) {
        return toResponse(findEntity(reviewId));
    }

    public ReviewResponse create(@NonNull ReviewRequest request) {
        ReviewEntity entity = new ReviewEntity();
        mapRequest(request, entity);
        entity.setMongoReviewId("spring-review-" + UUID.randomUUID());
        return toResponse(Objects.requireNonNull(reviewRepository.save(entity), "Saved review must not be null"));
    }

    public ReviewResponse update(@NonNull Long reviewId, @NonNull ReviewRequest request) {
        ReviewEntity entity = findEntity(reviewId);
        mapRequest(request, entity);
        return toResponse(Objects.requireNonNull(reviewRepository.save(entity), "Saved review must not be null"));
    }

    public void delete(@NonNull Long reviewId) {
        reviewRepository.delete(findEntity(reviewId));
    }

    @NonNull
    private ReviewEntity findEntity(@NonNull Long reviewId) {
        return reviewRepository.findById(reviewId)
                .orElseThrow(() -> new ResourceNotFoundException("Review not found with id=" + reviewId));
    }

    private void mapRequest(@NonNull ReviewRequest request, @NonNull ReviewEntity entity) {
        entity.setUserId(request.userId());
        entity.setMongoUserId(request.mongoUserId());
        entity.setComponentMongoId(request.componentMongoId());
        entity.setRating(request.rating());
        entity.setTitle(request.title() == null ? "" : request.title());
        entity.setComment(request.comment());
    }

    private ReviewResponse toResponse(@NonNull ReviewEntity entity) {
        return new ReviewResponse(
                Objects.requireNonNull(entity.getReviewId(), "Review id must not be null"),
                entity.getMongoReviewId(),
                Objects.requireNonNull(entity.getUserId(), "User id must not be null"),
                entity.getMongoUserId(),
                entity.getComponentMongoId(),
                entity.getRating(),
                entity.getTitle(),
                entity.getComment()
        );
    }
}
