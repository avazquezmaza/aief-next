# Executions Service

Lists workflow executions (scheduled jobs, imports, syncs) for the caller's tenant.

## Running locally

```bash
npm install
npm run dev
```

The server listens on port 3000 (override with `PORT`).

```bash
curl -H "X-Tenant-Id: tenant-a" http://localhost:3000/executions
```

## Tests

```bash
npm test
```
