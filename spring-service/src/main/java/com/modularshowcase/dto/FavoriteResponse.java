package com.modularshowcase.dto;

public final class FavoriteResponse {

        private final Long favoriteId;
        private final Long userId;
        private final String mongoUserId;
        private final String componentMongoId;

        public FavoriteResponse(Long favoriteId, Long userId, String mongoUserId, String componentMongoId) {
                this.favoriteId = favoriteId;
                this.userId = userId;
                this.mongoUserId = mongoUserId;
                this.componentMongoId = componentMongoId;
        }

        public Long favoriteId() {
                return favoriteId;
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
