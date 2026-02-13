/**
 * OTP Utility Functions for Password Reset
 * Generates, validates, and manages 7-digit OTP codes
 */

/**
 * Generate a random 7-digit OTP
 * @returns A string containing 7 random digits
 */
export function generateOTP(): string {
    return Math.floor(1000000 + Math.random() * 9000000).toString();
}

/**
 * Generate OTP expiration time (15 minutes from now)
 * @returns Date object for expiration time
 */
export function getOTPExpiration(): Date {
    const expiration = new Date();
    expiration.setMinutes(expiration.getMinutes() + 15);
    return expiration;
}

/**
 * Check if OTP is expired
 * @param expiresAt - The expiration datetime
 * @returns true if expired, false otherwise
 */
export function isOTPExpired(expiresAt: Date | string): boolean {
    const expiration = new Date(expiresAt);
    return new Date() > expiration;
}

/**
 * Validate OTP format (must be exactly 7 digits)
 * @param otp - The OTP to validate
 * @returns true if valid format, false otherwise
 */
export function isValidOTPFormat(otp: string): boolean {
    return /^\d{7}$/.test(otp);
}

/**
 * Format time remaining for OTP
 * @param expiresAt - The expiration datetime
 * @returns Formatted string like "14 minutes" or "2 minutes"
 */
export function formatTimeRemaining(expiresAt: Date | string): string {
    const expiration = new Date(expiresAt);
    const now = new Date();
    const diffMs = expiration.getTime() - now.getTime();
    
    if (diffMs <= 0) return 'expired';
    
    const minutes = Math.ceil(diffMs / 60000);
    return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
}

/**
 * Sanitize email to prevent injection
 * @param email - Email address to sanitize
 * @returns Sanitized email in lowercase
 */
export function sanitizeEmail(email: string): string {
    return email.trim().toLowerCase();
}
