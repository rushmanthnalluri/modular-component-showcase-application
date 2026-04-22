from gateway.services.circuitBreaker import CircuitBreaker


def test_circuit_breaker_opens_after_failures():
    breaker = CircuitBreaker(failure_threshold=2, recovery_timeout_seconds=1)
    assert breaker.allow_request() is True

    breaker.mark_failure()
    assert breaker.allow_request() is True

    breaker.mark_failure()
    assert breaker.allow_request() is False
