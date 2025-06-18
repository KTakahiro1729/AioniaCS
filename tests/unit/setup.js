import { webcrypto } from "crypto";
import * as Vue from "vue";
import * as VueCompilerDOM from "@vue/compiler-dom";

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

global.Vue = Vue;
global.VueCompilerDOM = VueCompilerDOM;
