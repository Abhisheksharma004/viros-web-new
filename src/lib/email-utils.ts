/**
 * Email utility functions for validation and processing
 */

/**
 * Validate email address format
 * @param email - Email address to validate
 * @returns true if email is valid, false otherwise
 */
export function isValidEmail(email: string): boolean {
    if (!email || typeof email !== 'string') {
        return false;
    }
    
    // RFC 5322 compliant regex (simplified)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    // Additional checks
    const hasValidLength = email.length >= 5 && email.length <= 254;
    const passesRegex = emailRegex.test(email);
    const hasNoDots = !email.startsWith('.') && !email.endsWith('.') && !email.includes('..');
    
    return hasValidLength && passesRegex && hasNoDots;
}

/**
 * Sanitize email address
 * @param email - Email address to sanitize
 * @returns Sanitized email or null if invalid
 */
export function sanitizeEmail(email: string): string | null {
    if (!email) return null;
    
    const trimmed = email.trim().toLowerCase();
    return isValidEmail(trimmed) ? trimmed : null;
}

/**
 * Validate bulk email addresses
 * @param emails - Array of email addresses
 * @returns Object with valid and invalid emails
 */
export function validateBulkEmails(emails: string[]): {
    valid: string[];
    invalid: string[];
} {
    const valid: string[] = [];
    const invalid: string[] = [];
    
    emails.forEach((email) => {
        const sanitized = sanitizeEmail(email);
        if (sanitized) {
            valid.push(sanitized);
        } else {
            invalid.push(email);
        }
    });
    
    return { valid, invalid };
}

/**
 * Extract domain from email
 * @param email - Email address
 * @returns Domain part or null
 */
export function getEmailDomain(email: string): string | null {
    if (!isValidEmail(email)) return null;
    const parts = email.split('@');
    return parts[1] || null;
}

/**
 * Check if email is from a common free provider
 * @param email - Email address
 * @returns true if from free provider
 */
export function isFreeEmailProvider(email: string): boolean {
    const freeProviders = [
        'gmail.com',
        'yahoo.com',
        'hotmail.com',
        'outlook.com',
        'live.com',
        'icloud.com',
        'aol.com',
        'mail.com',
        'protonmail.com',
        'zoho.com'
    ];
    
    const domain = getEmailDomain(email);
    return domain ? freeProviders.includes(domain.toLowerCase()) : false;
}
