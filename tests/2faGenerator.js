console.log("Running test for 2FA generator...");
const { generate2FASecret, verify2FACode } = require("../src/utils/2fa-generator");
console.log("2FA generator test started...");
console.log(generate2FASecret("testUser"));