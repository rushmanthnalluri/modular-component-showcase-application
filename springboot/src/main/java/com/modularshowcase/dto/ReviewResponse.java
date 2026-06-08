package com.modularshowcase.dto;

public final class ReviewResponse {

        private final Long reviewId;
        private final String mongoReviewId;
        private final Long userId;
        private final String mongoUserId;
        private final String componentMongoId;
        private final short rating;
        private final String title;
        private final String comment;

        public ReviewResponse(Long reviewId, String mongoReviewId, Long userId, String mongoUserId, String componentMongoId,
                        short rating, String title, String comment) {
                this.reviewId = reviewId;
                this.mongoReviewId = mongoReviewId;
                this.userId = userId;
                this.mongoUserId = mongoUserId;
                this.componentMongoId = componentMongoId;
                this.rating = rating;
                this.title = title;
                this.comment = comment;
        }

        public Long reviewId() {
                return reviewId;
        }

        public String mongoReviewId() {
                return mongoReviewId;
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
