package com.modularshowcase.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public final class ReviewRequest {

        @NotNull
        private final Long userId;

        @NotBlank
        private final String mongoUserId;

        @NotBlank
        private final String componentMongoId;

        @Min(1)
        @Max(5)
        private final short rating;

        private final String title;

        @NotBlank
        private final String comment;

        public ReviewRequest(Long userId, String mongoUserId, String componentMongoId, short rating, String title,
                        String comment) {
                this.userId = userId;
                this.mongoUserId = mongoUserId;
                this.componentMongoId = componentMongoId;
                this.rating = rating;
                this.title = title;
                this.comment = comment;
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

        public String title() {
                return title;
        }

        public String comment() {
                return comment;
        }
}
