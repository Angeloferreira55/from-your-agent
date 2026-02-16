import { Configuration, PostcardsApi, UsVerificationsApi } from "@lob/lob-typescript-sdk";

const config = new Configuration({
  username: process.env.LOB_API_KEY!,
});

export const lobPostcards = new PostcardsApi(config);
export const lobVerifications = new UsVerificationsApi(config);
