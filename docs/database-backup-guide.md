# Database Backup Guide

## PostgreSQL Backup

## Create backup

```bash
pg_dump "$DATABASE_URL" -F c -f backup/postgres/modular_components_$(date +%Y%m%d_%H%M%S).dump
```

## Restore backup

```bash
pg_restore --clean --if-exists --no-owner -d "$DATABASE_URL" backup/postgres/<file>.dump
```

## MongoDB Backup

## Create backup

```bash
mongodump --uri "$MONGODB_URI" --out backup/mongo/$(date +%Y%m%d_%H%M%S)
```

## Restore backup

```bash
mongorestore --uri "$MONGODB_URI" --drop backup/mongo/<folder>
```

## Backup Policy

- Development: nightly local backup.
- Production: daily full backup + point-in-time where platform supports it.
- Keep at least 14 days of rolling backups.
- Store encrypted backup artifacts outside the runtime host.

## Validation

- Run a monthly restore drill in a non-production environment.
- Verify schema + record counts after restore.

## Rollback Guidance
- PostgreSQL rollback-first option: restore latest validated dump into standby or temporary database, then switch traffic.
- Mongo rollback-first option: restore dump to staging cluster, verify collection counts and search indexes, then promote.
- Always re-run smoke checks after restore.
