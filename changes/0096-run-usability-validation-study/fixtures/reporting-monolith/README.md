# Ops Monolith

Internal operations app: billing summaries and an operations report page.

## Running locally

```bash
npm install
npm run dev
```

The server listens on port 3000 (override with `PORT`).

- `GET /invoices` — billing invoices (JSON).
- `GET /reports` — operations report page (HTML).

## Tests

```bash
npm test
```
