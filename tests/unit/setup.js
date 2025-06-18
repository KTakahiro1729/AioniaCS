import { webcrypto } from "crypto";

if (!global.crypto) {
  global.crypto = webcrypto;
}

// Ensure TextEncoder and TextDecoder are available
if (typeof global.TextEncoder === "undefined") {
  global.TextEncoder = webcrypto.TextEncoder;
}
if (typeof global.TextDecoder === "undefined") {
  global.TextDecoder = webcrypto.TextDecoder;
}
