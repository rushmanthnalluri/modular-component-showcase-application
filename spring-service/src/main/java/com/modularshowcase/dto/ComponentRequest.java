package com.modularshowcase.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record ComponentRequest(
        @NotBlank @Size(max = 160) String name,
        @NotBlank String description,
        @NotNull Long categoryId,
        @NotNull Long userId
) {
}
