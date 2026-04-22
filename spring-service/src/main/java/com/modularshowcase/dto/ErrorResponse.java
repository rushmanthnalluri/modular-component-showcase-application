package com.modularshowcase.dto;

import java.time.Instant;
import java.util.List;

public final class ErrorResponse {

        private final Instant timestamp;
        private final int status;
        private final String error;
        private final String message;
        private final String path;
        private final List<String> details;

        public ErrorResponse(Instant timestamp, int status, String error, String message, String path, List<String> details) {
                this.timestamp = timestamp;
                this.status = status;
                this.error = error;
                this.message = message;
                this.path = path;
                this.details = details;
        }

        public Instant timestamp() {
                return timestamp;
        }

        public int status() {
                return status;
        }

        public String error() {
                return error;
        }

        public String message() {
                return message;
        }

        public String path() {
                return path;
        }

        public List<String> details() {
                return details;
        }
}
