package com.modularshowcase.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public final class RatingRequest {

        @NotNull
        private final Long userId;

        @NotBlank
        private final String mongoUserId;

        @NotBlank
        private final String componentMongoId;

        @Min(1)
        @Max(5)
        private final short rating;

        public RatingRequest(Long userId, String mongoUserId, String componentMongoId, short rating) {
                this.userId = userId;
                this.mongoUserId = mongoUserId;
                this.componentMongoId = componentMongoId;
                this.rating = rating;
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

        public short rating() {
                return rating;
        }
}
