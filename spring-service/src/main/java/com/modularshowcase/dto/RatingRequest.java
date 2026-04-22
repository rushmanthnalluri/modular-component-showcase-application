package com.modularshowcase.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record RatingRequest(
        @NotNull Long userId,
        @NotBlank String mongoUserId,
        @NotBlank String componentMongoId,
        @Min(1) @Max(5) short rating
) {
}
