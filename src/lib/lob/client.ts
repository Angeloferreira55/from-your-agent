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
