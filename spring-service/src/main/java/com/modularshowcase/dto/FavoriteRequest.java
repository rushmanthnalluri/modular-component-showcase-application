package com.modularshowcase.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public final class FavoriteRequest {

        @NotNull
        private final Long userId;

        @NotBlank
        private final String mongoUserId;

        @NotBlank
        private final String componentMongoId;

        public FavoriteRequest(Long userId, String mongoUserId, String componentMongoId) {
                this.userId = userId;
                this.mongoUserId = mongoUserId;
                this.componentMongoId = componentMongoId;
        }

        public Long userId() {
                return userId;
        }

        public String mongoUserId() {
                return mongoUserId;
        }

        public String componentMongoId() {
                return componentMongoId;
        }
}
