package com.modularshowcase.dto;

public final class RatingResponse {

        private final Long ratingId;
        private final String mongoRatingId;
        private final Long userId;
        private final String mongoUserId;
        private final String componentMongoId;
        private final short rating;

        public RatingResponse(Long ratingId, String mongoRatingId, Long userId, String mongoUserId, String componentMongoId,
                        short rating) {
                this.ratingId = ratingId;
                this.mongoRatingId = mongoRatingId;
                this.userId = userId;
                this.mongoUserId = mongoUserId;
                this.componentMongoId = componentMongoId;
                this.rating = rating;
        }

        public Long ratingId() {
                return ratingId;
        }

        public String mongoRatingId() {
                return mongoRatingId;
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
