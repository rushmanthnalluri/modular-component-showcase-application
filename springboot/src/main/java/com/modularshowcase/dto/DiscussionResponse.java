package com.modularshowcase.dto;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;

public final class DiscussionResponse {

        private final Long discussionId;
        private final String mongoDiscussionId;
        private final Long userId;
        private final String mongoUserId;
        private final String componentMongoId;
        private final String parentMongoId;
        private final String message;
        private final int likes;
        private final String status;

        @JsonCreator
        public DiscussionResponse(
                        @JsonProperty("discussionId") Long discussionId,
                        @JsonProperty("mongoDiscussionId") String mongoDiscussionId,
                        @JsonProperty("userId") Long userId,
                        @JsonProperty("mongoUserId") String mongoUserId,
                        @JsonProperty("componentMongoId") String componentMongoId,
                        @JsonProperty("parentMongoId") String parentMongoId,
                        @JsonProperty("message") String message,
                        @JsonProperty("likes") int likes,
                        @JsonProperty("status") String status) {
                this.discussionId = discussionId;
                this.mongoDiscussionId = mongoDiscussionId;
                this.userId = userId;
                this.mongoUserId = mongoUserId;
                this.componentMongoId = componentMongoId;
                this.parentMongoId = parentMongoId;
                this.message = message;
                this.likes = likes;
                this.status = status;
        }

        @JsonProperty("discussionId")
        public Long discussionId() {
                return discussionId;
        }

        @JsonProperty("mongoDiscussionId")
        public String mongoDiscussionId() {
                return mongoDiscussionId;
        }

        @JsonProperty("userId")
        public Long userId() {
                return userId;
        }

        @JsonProperty("mongoUserId")
        public String mongoUserId() {
                return mongoUserId;
        }

        @JsonProperty("componentMongoId")
        public String componentMongoId() {
                return componentMongoId;
        }

        @JsonProperty("parentMongoId")
        public String parentMongoId() {
                return parentMongoId;
        }

        @JsonProperty("message")
        public String message() {
                return message;
        }

        @JsonProperty("likes")
        public int likes() {
                return likes;
        }

        @JsonProperty("status")
        public String status() {
                return status;
        }
}
