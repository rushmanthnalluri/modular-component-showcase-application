# Gateway Security Model

## Controls
- JWT bearer parsing dependency for secured routes
- cookie fallback for access/refresh token compatibility
- role-based dependency utilities
- sliding-window rate limiting with response headers
- correlation-id and `traceparent` propagation
- centralized structured error handling
- security response headers at ingress

## RBAC Matrix
| Role | Gateway capability |
|---|---|
| user | authenticated proxy access |
| developer | developer-only reconciliation and privileged routes |
| admin | administrative insight and repair operations |

## Trust Boundaries
- frontend to gateway: public internet boundary
- gateway to backend: trusted internal API boundary
- gateway to Spring: trusted internal Java service boundary

## JWT Lifecycle
1. client authenticates against backend-backed auth flow
2. gateway validates presented bearer or cookie token
3. downstream request receives correlation headers and forwarded auth context
4. expired/invalid tokens are rejected at dependency layer

## OAuth2 / OIDC Roadmap
- keep current JWT model for backward compatibility
- add external OIDC provider without breaking current gateway contracts
- map OIDC claims into the same `SecurityPrincipal` shape
