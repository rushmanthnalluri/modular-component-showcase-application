package com.modularshowcase.metrics;

import org.springframework.stereotype.Component;

import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.Timer;

@Component
public class RequestMetricsRecorder {

    private final Counter requestCounter;
    private final Counter errorCounter;
    private final Timer latencyTimer;

    public RequestMetricsRecorder(MeterRegistry meterRegistry) {
        this.requestCounter = Counter.builder("spring_service_requests_total")
                .description("Total HTTP requests handled by spring-service")
                .register(meterRegistry);
        this.errorCounter = Counter.builder("spring_service_errors_total")
                .description("Total HTTP responses with status >= 500")
                .register(meterRegistry);
        this.latencyTimer = Timer.builder("spring_service_request_latency_ms")
                .description("Spring service request latency")
                .publishPercentiles(0.5, 0.95, 0.99)
                .register(meterRegistry);
    }

    public void incrementRequests() {
        requestCounter.increment();
    }

    public void incrementErrors() {
        errorCounter.increment();
    }

    public Timer.Sample startLatencySample() {
        return Timer.start();
    }

    public void stopLatencySample(Timer.Sample sample) {
        sample.stop(latencyTimer);
    }
}
