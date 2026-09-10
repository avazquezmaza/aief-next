// Stable JSON result envelope (Change 0138). AIEF has no external consumer
// yet for machine-readable output — this is the first, deliberately small
// slice: `aief verify --json` only, not every command. A versioned
// `schema` field means a future breaking change to the shape is a new
// version string, never a silent, undetectable change to what a consumer
// (CI, a dashboard) already parses.
export const RESULT_SCHEMA = "aief.result/v1";

// buildResultEnvelope({ operation, change, result, ...fields }) -> the
// envelope object, ready for JSON.stringify(). `fields` are additive,
// operation-specific data (e.g. verify's `errors`/`warnings`) — this
// function only fixes the four keys every operation's envelope shares
// (`schema`, `operation`, `change`, `result`), always in that order.
export function buildResultEnvelope({ operation, change = null, result, ...fields }) {
  return { schema: RESULT_SCHEMA, operation, change, result, ...fields };
}
