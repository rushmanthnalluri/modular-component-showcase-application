package com.modularshowcase.controller;

import com.modularshowcase.dto.RatingRequest;
import com.modularshowcase.dto.RatingResponse;
import com.modularshowcase.service.RatingService;
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
@RequestMapping("/spring/ratings")
public class RatingController {

    private final RatingService ratingService;

    public RatingController(RatingService ratingService) {
        this.ratingService = ratingService;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('USER','DEVELOPER','ADMIN')")
    public List<RatingResponse> listRatings() {
        return ratingService.getAll();
    }

    @GetMapping("/{ratingId}")
    @PreAuthorize("hasAnyRole('USER','DEVELOPER','ADMIN')")
    public RatingResponse getRating(@PathVariable @NonNull Long ratingId) {
        return ratingService.getById(ratingId);
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('USER','DEVELOPER','ADMIN')")
    public RatingResponse createRating(@Valid @RequestBody @NonNull RatingRequest request) {
        return ratingService.create(request);
    }

    @PutMapping("/{ratingId}")
    @PreAuthorize("hasAnyRole('USER','DEVELOPER','ADMIN')")
    public RatingResponse updateRating(@PathVariable @NonNull Long ratingId,
            @Valid @RequestBody @NonNull RatingRequest request) {
        return ratingService.update(ratingId, request);
    }

    @DeleteMapping("/{ratingId}")
    @PreAuthorize("hasRole('ADMIN')")
    public void deleteRating(@PathVariable @NonNull Long ratingId) {
        ratingService.delete(ratingId);
    }
}
