"""Simple circuit breaker utility for downstream call protection."""

from __future__ import annotations

import time


class CircuitBreaker:
    def __init__(self, failure_threshold: int = 3, recovery_timeout_seconds: int = 30):
        self.failure_threshold = failure_threshold
        self.recovery_timeout_seconds = recovery_timeout_seconds
        self.failure_count = 0
        self.state = "closed"
        self.opened_at = 0.0

    def allow_request(self) -> bool:
        if self.state == "closed":
            return True

        if self.state == "open":
            if (time.time() - self.opened_at) >= self.recovery_timeout_seconds:
                self.state = "half_open"
                return True
            return False

        return True

    def mark_success(self) -> None:
        self.failure_count = 0
        self.state = "closed"

    def mark_failure(self) -> None:
        self.failure_count += 1
        if self.failure_count >= self.failure_threshold:
            self.state = "open"
            self.opened_at = time.time()
