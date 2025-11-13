// Year tabs management module
import { state } from './state.js';
import { saveData } from './data.js';
import { rebuildClientListFromState, sortRowsByField, updateSortIndicators } from './domUtils.js';
import { updateUIAndSummaries } from './main.js';

/**
 * Discovers years from existing clients in state and updates availableYears
 */
export function discoverYearsFromData() {
    const yearsSet = new Set();

    state.clients.forEach(client => {
        if (client.closeDate && client.closeDate.length >= 4) {
            const year = parseInt(client.closeDate.substring(0, 4), 10);
            if (!isNaN(year)) {
                yearsSet.add(year);
            }
        }
    });

    // Convert to sorted array (ascending order)
    state.availableYears = Array.from(yearsSet).sort((a, b) => a - b);

    // If no years found and no years exist, add current year
    if (state.availableYears.length === 0) {
        state.availableYears = [new Date().getFullYear()];
    }

    // Ensure activeYear is in availableYears
    if (!state.availableYears.includes(state.activeYear)) {
        state.availableYears.push(state.activeYear);
        state.availableYears.sort((a, b) => a - b);
    }
}

/**
 * Rebuilds all year tab buttons in the UI
 */
export function rebuildYearTabs() {
    const yearTabsContainer = document.getElementById('year-tabs');
    if (!yearTabsContainer) {
        console.error('[yearTabs] Year tabs container not found');
        return;
    }

    // Clear existing tabs
    yearTabsContainer.innerHTML = '';

    // Create a tab for each available year
    state.availableYears.forEach(year => {
        const button = document.createElement('button');
        button.className = 'year-tab';
        button.dataset.year = year;
        button.textContent = year;

        // Mark active year
        if (year === state.activeYear) {
            button.classList.add('active');
        }

        // Add click handler
        button.addEventListener('click', () => switchYear(year));

        yearTabsContainer.appendChild(button);
    });

    // Update Add Renewal modal year indicator if it exists
    updateAddRenewalYearIndicator();
}

/**
 * Switches to a different year tab
 * @param {number} year - The year to switch to
 */
export function switchYear(year) {
    if (year === state.activeYear) {
        return; // Already on this year
    }

    state.activeYear = year;

    // Save active year to localStorage
    localStorage.setItem('activeYear', year.toString());

    // Save state to localStorage
    saveData();

    // Rebuild UI for the new year
    rebuildYearTabs();
    rebuildClientListFromState();
    sortRowsByField(state.sortPreferences.field, state.sortPreferences.direction);
    updateSortIndicators(state.sortPreferences.field, state.sortPreferences.direction);
    updateUIAndSummaries();
}

/**
 * Adds a new year tab (no duplicates)
 * @param {number} year - The year to add
 * @returns {boolean} - True if added, false if already exists
 */
export function addYearTab(year) {
    if (state.availableYears.includes(year)) {
        return false; // Already exists
    }

    state.availableYears.push(year);
    state.availableYears.sort((a, b) => a - b); // Keep sorted

    // Save state
    saveData();

    // Rebuild tabs
    rebuildYearTabs();

    return true;
}

/**
 * Prompts user to add a new year
 */
export function promptAddYear() {
    const currentYear = new Date().getFullYear();
    const nextYear = Math.max(...state.availableYears, currentYear) + 1;

    const yearInput = prompt(`Enter year to add (e.g., ${nextYear}):`, nextYear);

    if (yearInput === null) {
        return; // User cancelled
    }

    const year = parseInt(yearInput, 10);

    if (isNaN(year)) {
        alert('Please enter a valid year number.');
        return;
    }

    if (year < 1900 || year > 2100) {
        alert('Please enter a year between 1900 and 2100.');
        return;
    }

    if (addYearTab(year)) {
        // Switch to the newly added year
        switchYear(year);
        alert(`Year ${year} added successfully!`);
    } else {
        alert(`Year ${year} already exists.`);
    }
}

/**
 * Updates the year indicator in the Add Renewal modal
 */
function updateAddRenewalYearIndicator() {
    const indicator = document.getElementById('add-renewal-year-indicator');
    if (indicator) {
        indicator.textContent = `(${state.activeYear})`;
    }
}

/**
 * Initializes year tabs on app load
 */
export function initializeYearTabs() {
    // Load saved active year from localStorage
    const savedYear = localStorage.getItem('activeYear');
    if (savedYear) {
        const year = parseInt(savedYear, 10);
        if (!isNaN(year)) {
            state.activeYear = year;
        }
    }

    // Discover years from data
    discoverYearsFromData();

    // Rebuild year tabs UI
    rebuildYearTabs();

    // Attach event listener to Add Year button
    const addYearBtn = document.getElementById('add-year-btn');
    if (addYearBtn) {
        addYearBtn.addEventListener('click', promptAddYear);
    }
}
