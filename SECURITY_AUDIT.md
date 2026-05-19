Security audit actions performed

- Removed hard-coded secrets from committed .env files:
  - backend/.env
  - spring-service/.env
  - frontend/.env
- Replaced secrets with clear placeholders and guidance to use CI/deployment secrets or a secrets manager.
- Recommended immediate next steps:
  1. Rotate any exposed credentials (DB, SMTP, Mongo, API keys) that were previously committed.
  2. Verify that no other committed files contain secrets: run `git grep -I --no-index -n "\bAKIA\b\|PRIVATE_KEY\|PASSWORD\=|JWT_SECRET|SPRING_JWT_SECRET|PGPASSWORD|MONGODB_URI|smtp"` and inspect results.
  3. Add a pre-commit hook to scan for high-entropy strings and common secret patterns (e.g., using `detect-secrets` or `git-secrets`).
  4. Ensure `.gitignore` contains `*.env` and any runtime secret files (already present but verify).

Notes:
- I did not alter application code or CI workflows beyond sanitizing .env files.
- After rotating secrets, update your deployment platform (Render/GitHub Actions/Neon) with the new values.
