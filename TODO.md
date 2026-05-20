# TODO (CORS Production Fix)

- [x] STEP 1: Update FastAPI gateway CORS origins + explicit preflight support

- [ ] STEP 2: Update Spring Boot production CORS allowed origins + ensure OPTIONS not blocked by Spring Security
- [ ] STEP 3: Verify/update Node.js backend CORS allowed headers/methods for preflight (keep origin whitelist + credentials)
- [ ] STEP 4: Validate captcha endpoint works end-to-end after CORS/preflight fix
- [ ] STEP 5: Verify auth cookies/JWT flow (login + /api/profile)
- [ ] STEP 6: Run end-to-end preflight checks (OPTIONS) for auth/profile/components/captcha through gateway
- [ ] STEP 7: Redeploy gateway + spring-service + node backend
- [ ] STEP 8: Final verification (login, captcha, profile, dashboards, add component, semantic search, SQL admin)
- [ ] STEP 9: Commit message: fix(cors): repair production cross-origin authentication and gateway access

