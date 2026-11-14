export const PRIVATE_RUNNER_HASH = "cd95487f39bda73e054a569ac806c93cad11883d6a4e8651860e6fa7c9c39c19";
// Public keys of the private runner's sealed secret (profile "private"). Public by design, also served by /api/privacy/config.
// Pinned here so a compromised backend cannot substitute its own keys. Build-time env overrides are for a key rotation only.
export const PRIVATE_TEE_KEY = "685012c942a97e6d16266f6aefd00371d183b5fad120b2a1cdc315c9a096e959";
export const PRIVATE_RECEIPT_KEY = "0fc41697787c6c3623482a6726eecf8b148cb9ef9ccd9e7bac477c3ab93394a7";
