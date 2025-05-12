document.addEventListener('DOMContentLoaded', () => {
    const settingsCogIcon = document.getElementById('settings-cog-icon');
    const settingsPanelModal = document.getElementById('settings-panel-modal');
    const closeSettingsPanelButton = document.getElementById('close-settings-panel');
    const darkModeToggle = document.getElementById('dark-mode-toggle');
    const saveSettingsButton = document.getElementById('save-settings-btn');

    // Function to open settings panel
    function openSettingsPanel() {
        if (settingsPanelModal) {
            settingsPanelModal.style.display = 'flex';
        }
    }

    // Function to close settings panel
    function closeSettingsPanel() {
        if (settingsPanelModal) {
            settingsPanelModal.style.display = 'none';
        }
    }

    // Function to apply dark mode
    function applyDarkMode(isDark) {
        if (isDark) {
            document.body.classList.add('dark-mode');
        } else {
            document.body.classList.remove('dark-mode');
        }

        // Send message to Chat Pro Iframe to toggle its dark mode
        const chatProIframe = document.getElementById('chatProSidebarIframe');
        if (chatProIframe && chatProIframe.contentWindow) {
            // The targetOrigin ' * ' is used for simplicity here.
            // For production, you should specify the exact origin of the iframe content for security.
            chatProIframe.contentWindow.postMessage({ type: 'TOGGLE_DARK_MODE', isDark: isDark }, '*');
        }
    }

    // Make a function available globally to sync iframe dark mode
    // This can be called by main.js after the iframe content is loaded
    window.syncChatIframeDarkMode = function() {
        const chatProIframe = document.getElementById('chatProSidebarIframe');
        if (chatProIframe && chatProIframe.contentWindow) {
            const isCurrentlyDark = document.body.classList.contains('dark-mode');
            chatProIframe.contentWindow.postMessage({ type: 'TOGGLE_DARK_MODE', isDark: isCurrentlyDark }, '*');
            console.log('[settings.js] Sent dark mode sync to iframe. Dark:', isCurrentlyDark);
        }
    };

    // Event listener for settings cog icon
    if (settingsCogIcon) {
        settingsCogIcon.addEventListener('click', openSettingsPanel);
    }

    // Event listener for close button in settings panel
    if (closeSettingsPanelButton) {
        closeSettingsPanelButton.addEventListener('click', closeSettingsPanel);
    }

    // Event listener for dark mode toggle
    if (darkModeToggle) {
        darkModeToggle.addEventListener('change', (event) => {
            const isDark = event.target.checked;
            applyDarkMode(isDark);
            localStorage.setItem('darkMode', isDark ? 'enabled' : 'disabled');
        });
    }

    // Event listener for save settings button
    if (saveSettingsButton) {
        saveSettingsButton.addEventListener('click', () => {
            // Placeholder for saving other settings
            console.log('Settings saved (placeholder)');
            // For now, just closes the panel. Implement actual save logic if needed.
            closeSettingsPanel(); 
        });
    }
    
    // Close modal if clicked outside the modal content
    if (settingsPanelModal) {
        settingsPanelModal.addEventListener('click', (event) => {
            if (event.target === settingsPanelModal) { // Check if the click is on the overlay itself
                closeSettingsPanel();
            }
        });
    }

    // Load dark mode preference on page load
    const savedDarkMode = localStorage.getItem('darkMode');
    if (savedDarkMode === 'enabled') {
        if (darkModeToggle) {
            darkModeToggle.checked = true;
        }
        applyDarkMode(true); // This will now also message the iframe
    } else {
        if (darkModeToggle) {
            darkModeToggle.checked = false; 
        }
        applyDarkMode(false); // This will now also message the iframe
    }

    // Placeholder for "In Construction" items
    const inConstructionItems = document.querySelectorAll('.setting-item span:not(.slider)');
    inConstructionItems.forEach(item => {
        if (item.textContent.includes('(In Construction)')) {
            const parentSettingItem = item.closest('.setting-item');
            if (parentSettingItem) {
                parentSettingItem.style.cursor = 'not-allowed';
                parentSettingItem.addEventListener('click', (e) => {
                    // Prevent toggle interaction if it's a label for a switch
                    if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'LABEL' && !e.target.classList.contains('slider')) {
                         alert('This setting is currently under construction.');
                    }
                });
            }
        }
    });
}); 