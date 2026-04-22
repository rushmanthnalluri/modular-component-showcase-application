package com.modularshowcase.dto;

public final class ComponentResponse {

        private final Long componentId;
        private final String name;
        private final String description;
        private final Long categoryId;
        private final Long userId;

        public ComponentResponse(Long componentId, String name, String description, Long categoryId, Long userId) {
                this.componentId = componentId;
                this.name = name;
                this.description = description;
                this.categoryId = categoryId;
                this.userId = userId;
        }

        public Long componentId() {
                return componentId;
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
