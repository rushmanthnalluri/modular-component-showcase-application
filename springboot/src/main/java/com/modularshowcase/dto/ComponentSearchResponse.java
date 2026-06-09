package com.modularshowcase.dto;

import java.util.List;

public final class ComponentSearchResponse {

        private final List<ComponentResponse> items;
        private final long totalElements;
        private final int totalPages;
        private final int page;
        private final int size;
        private final String sortBy;
        private final String direction;

        public ComponentSearchResponse(List<ComponentResponse> items, long totalElements, int totalPages, int page, int size,
                        String sortBy, String direction) {
                this.items = items;
                this.totalElements = totalElements;
                this.totalPages = totalPages;
                this.page = page;
                this.size = size;
                this.sortBy = sortBy;
                this.direction = direction;
        }

        public List<ComponentResponse> items() {
                return items;
        }

        public long totalElements() {
                return totalElements;
        }

        public int totalPages() {
                return totalPages;
        }

        public int page() {
                return page;
        }

        public int size() {
                return size;
        }

        public String sortBy() {
                return sortBy;
        }

        public String direction() {
                return direction;
        }
}
