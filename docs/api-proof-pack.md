# API Proof Pack

## Evidence Sources

- Contracts: `contracts/openapi-backend.yaml`, `contracts/openapi-gateway.yaml`, `contracts/openapi-spring.yaml`
- Gateway contract tests: `gateway/tests/test_contracts.py`, `gateway/tests/test_openapi_spec_files.py`
- Spring runtime contract tests: `spring-service/src/test/java/com/modularshowcase/OpenApiContractValidationTest.java`
- Cross-contract verification: `tests/verification/test_contract_parity.py`
- Gateway resilience tests: `gateway/tests/test_gateway_circuit_breaker.py`, `gateway/tests/test_resilience_failover.py`, `gateway/tests/test_timeout_behavior.py`, `gateway/tests/test_rate_limit.py`

## API Contract Validation Evidence

Validation now exists at three levels:

- Static YAML contract presence checks in CI
- Runtime Spring OpenAPI validation against the checked-in contract
- Cross-file parity checks for component and vector surfaces

## Response Schema Screenshot Placeholders

Reserved filenames live in `docs/screenshots/api/README.md`.

## Request Tracing Screenshot Placeholders

Reserved filenames live in `docs/screenshots/api/README.md`.

## JWT Flow Diagram Placeholder

Reserved filename: `docs/screenshots/api/api-jwt-flow-diagram.png`

Suggested flow to draw:

```text
Client -> /spring/auth/token -> JWT issued -> Gateway forwards Authorization header -> Backend/Spring authorizes RBAC
```

## RBAC Screenshot Placeholder

Reserved filename: `docs/screenshots/api/api-rbac-proof.png`

Recommended proof:

- one authorized request for `ADMIN` or `DEVELOPER`
- one denied request for a lower-privilege role

## Retry and Circuit Breaker Placeholder

Reserved filename: `docs/screenshots/api/api-retry-circuit-breaker.png`

Use the gateway resilience tests and a live trace/log capture to show:

- timeout handling
- retry attempt count
- open-circuit protection after repeated failure
