# OWASP Top 10 Mapping

## Mapped Controls
- A01 Broken Access Control: RBAC checks in backend and spring controllers.
- A02 Cryptographic Failures: JWT signatures, hashed passwords.
- A03 Injection: input validation and parameterized SQL.
- A04 Insecure Design: documented threat boundaries and rate limiting.
- A05 Security Misconfiguration: hardened env guidance and production checks.
- A06 Vulnerable Components: CI dependency audit and security workflow.
- A07 Identification/Auth Failures: auth token refresh and role checks.
- A08 Software/Data Integrity: CI workflows and branch checks.
- A09 Logging/Monitoring: health + metrics + correlation IDs.
- A10 SSRF: controlled gateway forwarding to configured downstream URLs.
