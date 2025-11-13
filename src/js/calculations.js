/**
 * Calculates summary statistics from the client data.
 */

/**
 * Checks if a deal is confirmed based on its checked status.
 * @param {object} client - The client/renewal object from the DOM/state, which should include an `isChecked` property.
 * @returns {boolean} True if the deal is confirmed (checked), false otherwise.
 */
function isConfirmed(client) {
    // return client && client.closeDate && client.closeDate.trim() !== ''; // Old logic based on closeDate
    return client && client.isChecked === true; // New logic based on checkbox state
}

/**
 * Calculates the total amount of confirmed deals.
 * @param {Array<object>} clients - The list of client objects.
 * @returns {number} The total confirmed amount.
 */
export function calculateTotalConfirmed(clients) {
    // console.log(`[CalcConfirmed] Starting calculation for ${clients?.length || 0} clients.`); // Removed log
    let confirmedTotal = 0;
    clients?.forEach(client => {
        if (isConfirmed(client)) {
            // Ensure amount is treated as a number
            const amount = client.amount;
            const numericAmount = parseFloat(amount) || 0;
            // console.log(`[CalcConfirmed] Confirmed Client: ${client.name || client.id}, Amount: ${amount}, Parsed: ${numericAmount}`); // Removed per-client log
            confirmedTotal += numericAmount;
        }
    });
    // console.log(`[CalcConfirmed] Final Confirmed Amount: ${confirmedTotal}`); // Removed final log
    return confirmedTotal;
}

/**
 * Calculates the number of confirmed deals.
 * @param {Array<object>} clients - The list of client objects.
 * @returns {number} The count of confirmed deals.
 */
export function countConfirmedDeals(clients) {
    return clients.filter(isConfirmed).length;
}


/**
 * Calculates the average deal size of confirmed deals.
 * @param {Array<object>} clients - The list of client objects.
 * @returns {number} The average deal size. Returns 0 if no confirmed deals.
 */
export function calculateAverageDealSize(clients) {
    const confirmedClients = clients.filter(isConfirmed);
    const totalConfirmedAmount = calculateTotalConfirmed(confirmedClients); // Reuse total calculation
    const numberOfConfirmedDeals = confirmedClients.length; // Reuse count calculation

    return numberOfConfirmedDeals > 0 ? totalConfirmedAmount / numberOfConfirmedDeals : 0;
}


/**
 * Calculates the monthly subtotals for confirmed deals based on Close Date.
 * @param {Array<object>} clients - The list of client objects.
 * @returns {object} An object where keys are 'YYYY-MM' and values are the subtotal amount for that month.
 */
export function calculateMonthlySubtotals(clients) {
    const monthlyTotals = {};
    clients.forEach(client => {
        if (isConfirmed(client)) {
            try {
                // Extract YYYY-MM from the close date
                const monthYear = client.closeDate.substring(0, 7); // Assumes 'YYYY-MM-DD' format
                const amount = parseFloat(client.amount) || 0;

                if (!monthlyTotals[monthYear]) {
                    monthlyTotals[monthYear] = 0;
                }
                monthlyTotals[monthYear] += amount;
            } catch (e) {
                console.error("Error parsing date for monthly subtotal:", client.closeDate, e);
            }
        }
    });
    return monthlyTotals;
}

/**
 * Formats a number as USD currency.
 * @param {number} amount - The amount to format.
 * @returns {string} Formatted currency string (e.g., "$1,234.56").
 */
export function formatCurrency(amount, options = { showCents: true }) {
    if (typeof amount !== 'number') {
        amount = Number(amount) || 0;
    }

    if (options && options.showCents === false) {
        const roundedAmount = Math.round(amount);
        // Format with commas and a dollar sign, no cents
        return '$' + roundedAmount.toLocaleString('en-US');
    }

    // Existing logic for formatting with cents
    return amount.toLocaleString('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
}

// Example of calculating all stats needed for the UI
export function calculateAllSummaryStats(clients, goal) {
     const totalConfirmed = calculateTotalConfirmed(clients);
     const confirmedCount = countConfirmedDeals(clients);
     const averageDealSize = calculateAverageDealSize(clients);
     const totalEnteredAmount = calculateTotalAmountAllEntries(clients); // Calculate total entered amount

     return {
         totalConfirmed,
         confirmedCount,
         averageDealSize,
         goal: goal || 0, // Include goal if provided
         totalEnteredAmount, // Add to returned stats object
     };
}

/**
 * Calculates the total number of entries.
 * @param {Array<object>} clients - The list of client objects.
 * @returns {number} The total number of clients.
 */
export function calculateTotalEntries(clients) {
    return clients ? clients.length : 0; // Handle null/undefined input
}

/**
 * Calculates the total amount of all deals (confirmed or not).
 * @param {Array<object>} clients - The list of client objects.
 * @returns {number} The total amount of all entries.
 */
export function calculateTotalAmountAllEntries(clients) {
    // console.log(`[CalcAll] Starting calculation for ${clients?.length || 0} clients.`); // Removed log
    let total = 0;
    clients?.forEach(client => {
        // Ensure amount is treated as a number
        const amount = client.amount; 
        const numericAmount = parseFloat(amount) || 0;
        // console.log(`[CalcAll] Client: ${client.name || client.id}, Amount: ${amount}, Parsed: ${numericAmount}`); // Removed per-client log
        total += numericAmount;
    });
    // console.log(`[CalcAll] Final Total Amount: ${total}`); // Removed final log
    return total;
}

/**
 * Calculates the subtotal amount for a specific month from a list of client data.
 *
 * @param {string} monthName - The lowercase full name of the month (e.g., 'january').
 * @param {Array<object>} clientsArray - An array of client objects, each expected to have a 'closeDate' (YYYY-MM-DD) and 'amount'.
 * @returns {number} The calculated subtotal for the specified month.
 */
export function calculateMonthlySubtotal(monthName, clientsArray) {
    if (!monthName || !Array.isArray(clientsArray)) {
        console.error("calculateMonthlySubtotal: Invalid arguments provided.", { monthName, clientsArray });
        return 0;
    }

    const monthSubtotal = clientsArray.reduce((sum, client) => {
        if (!client || !client.closeDate) {
            // console.warn("calculateMonthlySubtotal: Skipping client with missing data", client);
            return sum;
        }
        try {
            // Extract month name from closeDate (YYYY-MM-DD)
            // Ensure correct date parsing - add T00:00:00 for timezone consistency
            const clientMonth = new Date(client.closeDate + 'T00:00:00')
                                  .toLocaleString('en-US', { month: 'long' })
                                  .toLowerCase();

            if (clientMonth === monthName) {
                // Use parseAmount or ensure amount is a number
                const amount = typeof client.amount === 'number' ? client.amount : parseFloat(client.amount) || 0;
                return sum + amount;
            }
        } catch (e) {
             console.error("calculateMonthlySubtotal: Error processing client date", client, e);
        }
        return sum;
    }, 0);

    return monthSubtotal;
}

// Ensure this file only contains calculations and related utilities.
// DOM manipulation or state management should be elsewhere. 