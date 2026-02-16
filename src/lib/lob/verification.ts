import { lobVerifications } from "./client";

export interface VerificationResult {
  deliverability: string;
  primary_line: string;
  secondary_line: string;
  city: string;
  state: string;
  zip_code: string;
  latitude: number | null;
  longitude: number | null;
}

/**
 * Verify a US address via Lob.
 */
export async function verifyAddress(address: {
  primary_line: string;
  secondary_line?: string;
  city: string;
  state: string;
  zip_code: string;
}): Promise<VerificationResult> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = await lobVerifications.verifySingle({
    primary_line: address.primary_line,
    secondary_line: address.secondary_line || "",
    city: address.city,
    state: address.state,
    zip_code: address.zip_code,
  } as any);

  return {
    deliverability: result.deliverability || "unknown",
    primary_line: result.primary_line || address.primary_line,
    secondary_line: result.secondary_line || "",
    city: result.components?.city || address.city,
    state: result.components?.state || address.state,
    zip_code: result.components?.zip_code || address.zip_code,
    latitude: result.components?.latitude ? parseFloat(String(result.components.latitude)) : null,
    longitude: result.components?.longitude ? parseFloat(String(result.components.longitude)) : null,
  };
}
