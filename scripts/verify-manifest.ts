import { executeVerification, VerificationReport, parseVerifyCliArgs } from "./verify";

/**
 * Backwards-compatible export of verifyManifest.
 */
export async function verifyManifest(manifestPathOrNetwork?: string): Promise<VerificationReport[]> {
  return executeVerification({ manifest: manifestPathOrNetwork });
}

export { executeVerification, VerificationReport };

if (require.main === module) {
  const cliOpts = parseVerifyCliArgs();
  executeVerification(cliOpts).catch((err) => {
    console.error("Verification script failed:", err);
    process.exit(1);
  });
}
