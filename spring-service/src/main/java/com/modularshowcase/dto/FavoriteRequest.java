package com.modularshowcase.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record FavoriteRequest(
        @NotNull Long userId,
        @NotBlank String mongoUserId,
        @NotBlank String componentMongoId
) {
}
