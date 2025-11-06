// Utility functions

/**
 * Formats a number as currency (e.g., 12345.67 -> 12,345.67).
 * @param {number} amount - The amount to format.
 * @returns {string} The formatted currency string.
 */
export function formatCurrency(amount) {
    // Ensure amount is a number, default to 0 if not
    const numAmount = Number(amount);
    if (isNaN(numAmount)) {
        console.warn('formatCurrency received non-numeric value:', amount);
        return '0'; // Or handle as appropriate, like returning 'NaN' or an empty string
    }
    return new Intl.NumberFormat('en-US').format(numAmount);
}

/**
 * Displays a temporary message to the user.
 * @param {string} message - The message to display.
 * @param {string} [type='success'] - The type of message ('success' or 'error').
 */
export function showMessage(message, type = 'success') {
    let messageEl = document.getElementById('sync-message');
    if (!messageEl) {
        messageEl = document.createElement('span');
        messageEl.id = 'sync-message';
        messageEl.className = 'sync-message';
        const backupOptions = document.getElementById('backup-options');
        if (backupOptions) {
             backupOptions.appendChild(messageEl);
        } else {
             console.error("Could not find #backup-options to append sync message.");
             // Optionally append to body or another fallback element
             document.body.appendChild(messageEl);
        }
    }
    
    messageEl.textContent = message;
    messageEl.style.color = type === 'success' ? 'var(--success-color)' : 'var(--error-color)';
    
    // Clear message after 3 seconds
    setTimeout(() => {
        if (messageEl) {
            messageEl.textContent = '';
        }
    }, 3000);
}

/**
 * Generates a unique ID string.
 * @returns {string} A unique ID.
 */
export function generateId() {
    return 'row_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
}

/**
 * Formats a date string or Date object into MM/DD/YYYY format.
 * Handles invalid dates.
 * @param {string | Date | null} dateInput - The date string (e.g., 'YYYY-MM-DD') or Date object.
 * @returns {string} Formatted date string or empty string if invalid/null.
 */
export function formatDate(dateInput) {
    if (!dateInput) return '';
    try {
        // Attempt to create a date object. Handle potential timezone issues if needed.
        // Adding 'T00:00:00' treats the input as local time regardless of timezone.
        const date = dateInput instanceof Date ? dateInput : new Date(`${dateInput}T00:00:00`);
        if (isNaN(date.getTime())) {
            throw new Error('Invalid Date');
        }
        return date.toLocaleDateString('en-US', {
            month: 'numeric',
            day: 'numeric',
            year: 'numeric'
        });
    } catch (e) {
        console.warn('Error formatting date:', dateInput, e);
        return ''; // Return empty for invalid dates
    }
}

/**
 * Parses a date string (MM/DD/YYYY or YYYY-MM-DD) into YYYY-MM-DD format.
 * @param {string} dateString - The date string to parse.
 * @returns {string} Date in YYYY-MM-DD format or empty string if invalid.
 */
export const parseDate = (dateString) => {
    if (!dateString) return '';
    try {
        // Try parsing common formats
        const date = new Date(dateString);
        if (isNaN(date.getTime())) {
             // Handle MM/DD/YYYY specifically if needed, though Date() often handles it
             const parts = dateString.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
             if (parts) {
                 // parts[1] = month, parts[2] = day, parts[3] = year
                 const isoDate = new Date(`${parts[3]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}T00:00:00`);
                 if (!isNaN(isoDate.getTime())) {
                    const year = isoDate.getFullYear();
                    const month = (isoDate.getMonth() + 1).toString().padStart(2, '0');
                    const day = isoDate.getDate().toString().padStart(2, '0');
                    return `${year}-${month}-${day}`;
                 }
             }
             throw new Error('Invalid date format for parsing');
        }
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        return `${year}-${month}-${day}`;
    } catch (e) {
        console.warn('Could not parse date string:', dateString, e);
        return '';
    }
};

/**
 * Parses a currency string (e.g., "USD 1,234.56") into a number.
 * @param {string} amountStr - The currency string.
 * @returns {number} The parsed amount, or 0 if invalid.
 */
export const parseAmount = (amountStr) => {
    if (typeof amountStr !== 'string') return 0;
    const numStr = amountStr.replace(/USD\s*|\,/g, ''); // Remove 'USD', whitespace, and commas
    const amount = parseFloat(numStr);
    return isNaN(amount) ? 0 : amount;
};

/**
 * Extracts the month name (lowercase) from a Date object or date string.
 * Defaults to the current month if the date is invalid.
 * @param {Date | string | null} dateInput - The date to extract the month from.
 * @returns {string} The lowercase month name (e.g., 'january').
 */
export function getMonthFromDate(dateInput) {
    const monthNames = ['january', 'february', 'march', 'april', 'may', 'june',
                       'july', 'august', 'september', 'october', 'november', 'december'];
    try {
        let date;
        if (dateInput instanceof Date) {
            date = dateInput;
        } else if (typeof dateInput === 'string') {
            // Adding 'T00:00:00' helps ensure consistent parsing across timezones
            date = new Date(`${dateInput}T00:00:00`);
        } else {
            // Use current date if input is null or undefined
             date = new Date();
             console.warn("getMonthFromDate: Received invalid input, using current date.");
        }

        if (isNaN(date.getTime())) {
             throw new Error('Invalid Date object');
        }
        return monthNames[date.getMonth()];
    } catch (error) {
        console.warn("getMonthFromDate: Error parsing date, defaulting to current month.", dateInput, error);
        // Fallback to current month on error
        return monthNames[new Date().getMonth()];
    }
}

// --- KPI Calculation Functions ---

/**
 * Calculates the total amount of confirmed (checked) licenses.
 * @param {Array<object>} licenses - Array of license objects, each having `amount` and `isChecked` properties.
 * @returns {number} The total confirmed amount.
 */
export function calculateTotalConfirmedAmount(licenses) {
    if (!Array.isArray(licenses)) return 0;
    return licenses
        .filter(license => license.isChecked) // Filter for checked licenses
        .reduce((sum, license) => sum + (Number(license.amount) || 0), 0); // Sum amounts
}

/**
 * Calculates the average amount of confirmed (checked) licenses.
 * @param {Array<object>} licenses - Array of license objects.
 * @returns {number} The average confirmed amount.
 */
export function calculateAverageConfirmedAmount(licenses) {
    if (!Array.isArray(licenses)) return 0;
    const confirmedLicenses = licenses.filter(license => license.isChecked);
    const count = confirmedLicenses.length;
    if (count === 0) return 0;
    
    const totalAmount = calculateTotalConfirmedAmount(confirmedLicenses); // Reuse total calculation
    return totalAmount / count;
}

/**
 * Calculates the confirmation rate as a percentage.
 * @param {number} confirmedCount - The number of confirmed items.
 * @param {number} totalPool - The total number of items possible.
 * @returns {number} The confirmation rate percentage.
 */
export function calculateConfirmationRate(confirmedCount, totalPool) {
    const count = Number(confirmedCount) || 0;
    const pool = Number(totalPool) || 0;
    if (pool === 0) return 0; // Avoid division by zero
    return (count / pool) * 100;
}