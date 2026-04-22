package com.modularshowcase.controller;

import com.modularshowcase.dto.ReviewRequest;
import com.modularshowcase.dto.ReviewResponse;
import com.modularshowcase.service.ReviewService;
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
@RequestMapping("/spring/reviews")
public class ReviewController {

    private final ReviewService reviewService;

    public ReviewController(ReviewService reviewService) {
        this.reviewService = reviewService;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('USER','DEVELOPER','ADMIN')")
    public List<ReviewResponse> listReviews() {
        return reviewService.getAll();
    }

    @GetMapping("/{reviewId}")
    @PreAuthorize("hasAnyRole('USER','DEVELOPER','ADMIN')")
    public ReviewResponse getReview(@PathVariable @NonNull Long reviewId) {
        return reviewService.getById(reviewId);
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('USER','DEVELOPER','ADMIN')")
    public ReviewResponse createReview(@Valid @RequestBody @NonNull ReviewRequest request) {
        return reviewService.create(request);
    }

    @PutMapping("/{reviewId}")
    @PreAuthorize("hasAnyRole('USER','DEVELOPER','ADMIN')")
    public ReviewResponse updateReview(@PathVariable @NonNull Long reviewId,
            @Valid @RequestBody @NonNull ReviewRequest request) {
        return reviewService.update(reviewId, request);
    }

    @DeleteMapping("/{reviewId}")
    @PreAuthorize("hasAnyRole('ADMIN')")
    public void deleteReview(@PathVariable @NonNull Long reviewId) {
        reviewService.delete(reviewId);
    }
}
