import { Configuration, PostcardsApi, UsVerificationsApi } from "@lob/lob-typescript-sdk";

let _config: Configuration | null = null;
function getConfig() {
  if (!_config) {
    _config = new Configuration({ username: process.env.LOB_API_KEY || "" });
  }
  return _config;
}

let _postcards: PostcardsApi | null = null;
let _verifications: UsVerificationsApi | null = null;

export const lobPostcards = new Proxy({} as PostcardsApi, {
  get(_, prop) {
    if (!_postcards) _postcards = new PostcardsApi(getConfig());
    return (_postcards as unknown as Record<string | symbol, unknown>)[prop];
  },
});

export const lobVerifications = new Proxy({} as UsVerificationsApi, {
  get(_, prop) {
    if (!_verifications) _verifications = new UsVerificationsApi(getConfig());
    return (_verifications as unknown as Record<string | symbol, unknown>)[prop];
  },
});

/**
 * Build a PostcardsApi bound to an explicit API key. Used by the "Test to Lob"
 * flow so a proof can be generated with a TEST key regardless of the live key
 * configured for production mailing.
 */
export function createPostcardsApi(apiKey: string): PostcardsApi {
  return new PostcardsApi(new Configuration({ username: apiKey }));
}

/**
 * Resolves the Lob TEST key. Prefers LOB_TEST_API_KEY; otherwise falls back to
 * LOB_API_KEY only when it is itself a test key (test_...). Returns null when no
 * safe test key is available — callers MUST refuse to "test" with a live key.
 */
export function getLobTestKey(): string | null {
  const explicit = process.env.LOB_TEST_API_KEY;
  if (explicit && explicit.startsWith("test_")) return explicit;
  const main = process.env.LOB_API_KEY;
  if (main && main.startsWith("test_")) return main;
  return null;
}
