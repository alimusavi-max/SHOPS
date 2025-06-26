// Simulated OTP generation and verification utility

const otpStorage = {}; // In-memory store: { identifier: { otp, expiresAt } }
const OTP_EXPIRY_MINUTES = 2; // OTPs expire in 2 minutes for simulation

/**
 * Generates a 6-digit OTP.
 * @returns {string} The generated OTP.
 */
function generateRandomOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Cleans up expired OTPs from storage.
 * This is a simple cleanup; a real app might use a TTL mechanism in Redis.
 */
function cleanupExpiredOTPs() {
  const now = Date.now();
  for (const identifier in otpStorage) {
    if (otpStorage[identifier].expiresAt < now) {
      delete otpStorage[identifier];
    }
  }
}

/**
 * Generates an OTP, stores it with an expiry, and logs it for simulation.
 * In a real system, this would also trigger sending the OTP via SMS/email.
 * @param {string} identifier - The user identifier (e.g., phone number or email).
 * @returns {Promise<string>} - The generated OTP (for logging/testing purposes).
 */
exports.generateOTP = async (identifier) => {
  cleanupExpiredOTPs(); // Basic cleanup before generating a new one

  const otp = generateRandomOTP();
  const expiresAt = Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000;

  otpStorage[identifier] = { otp, expiresAt };

  console.log(`************************************************************`);
  console.log(`SIMULATED OTP for ${identifier}: ${otp}`);
  console.log(`Expires at: ${new Date(expiresAt).toLocaleTimeString()}`);
  console.log(`************************************************************`);

  // In a real app, you would await an SMS/email sending service here.
  // e.g., await smsService.sendOTP(identifier, otp);

  return otp; // Returning for logging, auth-controller doesn't directly use this return value
};

/**
 * Verifies a given OTP against a stored OTP for the identifier.
 * @param {string} identifier - The user identifier (e.g., phone number or email).
 * @param {string} otpToVerify - The OTP entered by the user.
 * @returns {Promise<boolean>} - True if OTP is valid and not expired, false otherwise.
 */
exports.verifyOTP = async (identifier, otpToVerify) => {
  cleanupExpiredOTPs(); // Ensure we're checking against non-expired OTPs

  const storedEntry = otpStorage[identifier];

  if (!storedEntry) {
    console.warn(`OTP Verification Failed: No OTP found for ${identifier}.`);
    return false;
  }

  if (storedEntry.expiresAt < Date.now()) {
    console.warn(`OTP Verification Failed: OTP for ${identifier} has expired.`);
    delete otpStorage[identifier]; // Clean up expired OTP
    return false;
  }

  if (storedEntry.otp === otpToVerify) {
    console.log(`OTP Verification Successful for ${identifier}.`);
    delete otpStorage[identifier]; // OTP is one-time use
    return true;
  }

  console.warn(`OTP Verification Failed: Invalid OTP ${otpToVerify} for ${identifier}. Expected ${storedEntry.otp}`);
  // Optionally, implement attempt tracking here
  return false;
};

// For testing/debugging purposes, allow getting the storage
// In a real app, you wouldn't expose this.
exports.getOtpStorage = () => otpStorage;

console.log('OTP Utility (Simulated with In-Memory Storage) Initialized.');
