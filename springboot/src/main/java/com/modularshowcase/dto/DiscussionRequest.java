package com.modularshowcase.dto;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public final class DiscussionRequest {

        @NotNull
        private final Long userId;

        @NotBlank
        private final String mongoUserId;

        @NotBlank
        private final String componentMongoId;

        private final String parentMongoId;

        @NotBlank
        @Size(max = 2_000)
        private final String message;

        @Min(0)
        private final int likes;

        @Size(max = 32)
        private final String status;

        @JsonCreator
        public DiscussionRequest(
                        @JsonProperty("userId") Long userId,
                        @JsonProperty("mongoUserId") String mongoUserId,
                        @JsonProperty("componentMongoId") String componentMongoId,
                        @JsonProperty("parentMongoId") String parentMongoId,
                        @JsonProperty("message") String message,
                        @JsonProperty("likes") int likes,
                        @JsonProperty("status") String status) {
                this.userId = userId;
                this.mongoUserId = mongoUserId;
                this.componentMongoId = componentMongoId;
                this.parentMongoId = parentMongoId;
                this.message = message;
                this.likes = likes;
                this.status = status;
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
