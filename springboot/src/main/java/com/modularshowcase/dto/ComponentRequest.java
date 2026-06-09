package com.modularshowcase.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public final class ComponentRequest {

        @NotBlank
        @Size(max = 160)
        private final String name;

        @NotBlank
        private final String description;

        @NotNull
        private final Long categoryId;

        @NotNull
        private final Long userId;

        public ComponentRequest(String name, String description, Long categoryId, Long userId) {
                this.name = name;
                this.description = description;
                this.categoryId = categoryId;
                this.userId = userId;
        }

        public String name() {
                return name;
        }

        public String description() {
                return description;
        }

        public Long categoryId() {
                return categoryId;
        }

        public Long userId() {
                return userId;
        }
}
