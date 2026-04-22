package com.modularshowcase.dto;

import java.util.List;

public record ComponentSearchResponse(
        List<ComponentResponse> items,
        long totalElements,
        int totalPages,
        int page,
        int size,
        String sortBy,
        String direction
) {
}
