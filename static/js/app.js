/**
 * Main Application Entry Point
 * Initializes all modules and sets up global functionality
 */

// Configuration and global variables
const APP_CONFIG = {
    debug: true,
    environment: 'production',
    apiTimeout: 15000,
    version: '1.0.0'
};

// Utility Functions
const APP_UTILS = {
    // Logging with better visibility
    log: function(message, type = 'info', data = null) {
        if (!APP_CONFIG.debug && type !== 'error') return;
        
        const styles = {
            info: 'color: #0ea5e9; font-weight: bold;',
            warning: 'color: #f59e0b; font-weight: bold;',
            error: 'color: #ef4444; font-weight: bold;',
            success: 'color: #10b981; font-weight: bold;'
        };
        
        console.log(`%c[Lieferspatz App] ${message}`, styles[type]);
        if (data) console.log(data);
    },
    
    // Format currency
    formatCurrency: function(amount) {
        return '€' + parseFloat(amount).toFixed(2);
    },
    
    // Easy DOM selection
    $(selector) {
        return document.querySelector(selector);
    },
    
    $$(selector) {
        return document.querySelectorAll(selector);
    }
};

// Initialize the application when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    APP_UTILS.log('🚀 Application Initializing', 'info');
    initApplication();
});

/**
 * Main initialization function
 */
function initApplication() {
    try {
        // Initialize UI first for immediate visual feedback
        APP_UTILS.log('Initializing UI System', 'info');
        
        // Add a small delay to ensure all styles are loaded
        setTimeout(() => {
            // UI Specific initialization - header fix is critical
            fixHeader();
        }, 0);
        
        // Register service worker if available
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js').then(function(registration) {
                APP_UTILS.log('ServiceWorker registered', 'success');
            }).catch(function(error) {
                APP_UTILS.log('ServiceWorker registration failed', 'error', error);
            });
        }
        
        // Set up global event listeners
        setupGlobalEventListeners();
        
        // Set up emergency DOM observer for dynamic content
        setupDOMObserver();
        
        // Log successful initialization
        APP_UTILS.log('🎉 Application Initialized Successfully', 'success');
    } catch (error) {
        APP_UTILS.log('Application initialization failed', 'error', error);
        
        // Emergency recovery
        fixHeader(); // Always try to at least fix the header
    }
}

/**
 * Critical Header Fix - applied immediately and repeatedly
 * This is extracted to be callable from multiple places and runs
 * even if other initialization fails
 */
function fixHeader() {
    APP_UTILS.log('🔧 Applying critical header fix', 'info');
    
    // Find header element
    const header = document.querySelector('header');
    
    if (header) {
        // Force correct header styles
        header.style.cssText = `
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            width: 100% !important;
            z-index: 1000 !important;
            background: linear-gradient(to right, #0d9488, #0f766e) !important;
            background-image: none !important;
            background-blend-mode: normal !important;
            backdrop-filter: none !important;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1) !important;
            min-height: 60px !important;
            display: flex !important;
            align-items: center !important;
            justify-content: space-between !important;
            padding: 0 1rem !important;
            visibility: visible !important;
            opacity: 1 !important;
        `;
        
        // Add a style tag with high specificity rules
        const styleEl = document.createElement('style');
        styleEl.textContent = `
            header, header.header, body > header, .header, #header {
                position: fixed !important;
                top: 0 !important;
                left: 0 !important;
                width: 100% !important;
                z-index: 1000 !important;
                background: linear-gradient(to right, #0d9488, #0f766e) !important;
                background-image: none !important;
                background-blend-mode: normal !important;
                backdrop-filter: none !important;
                visibility: visible !important;
                opacity: 1 !important;
            }
            
            header::before, header::after,
            .header::before, .header::after,
            #header::before, #header::after {
                display: none !important;
                content: none !important;
                background: none !important;
            }
        `;
        
        // Only add style if it doesn't exist
        if (!document.getElementById('emergency-header-style')) {
            styleEl.id = 'emergency-header-style';
            document.head.appendChild(styleEl);
        }
        
        // Fix z-index issues by ensuring all dropdowns and navigation
        // items in the header are visible
        const headerElements = header.querySelectorAll('*');
        headerElements.forEach(el => {
            if (window.getComputedStyle(el).getPropertyValue('position') === 'absolute' ||
                window.getComputedStyle(el).getPropertyValue('position') === 'fixed') {
                el.style.zIndex = '1001';
            }
            
            // Ensure visibility of critical elements
            if (el.id === 'cart-btn' || el.classList.contains('cart-btn') ||
                el.id === 'logo' || el.classList.contains('logo')) {
                el.style.visibility = 'visible';
                el.style.opacity = '1';
                el.style.display = el.classList.contains('logo') ? 'block' : 'flex';
                el.style.zIndex = '1002';
            }
        });
        
        APP_UTILS.log('✅ Header fix applied', 'success');
    } else {
        APP_UTILS.log('⚠️ Header element not found', 'warning');
    }
}

/**
 * Set up global event listeners
 */
function setupGlobalEventListeners() {
    APP_UTILS.log('Setting up global event listeners', 'info');
    
    // Listen for page visibility changes
    document.addEventListener('visibilitychange', function() {
        if (document.visibilityState === 'visible') {
            APP_UTILS.log('Page became visible, refreshing UI', 'info');
            fixHeader();
        }
    });
    
    // Listen for load event for late styling
    window.addEventListener('load', function() {
        APP_UTILS.log('Window fully loaded, applying final styles', 'info');
        fixHeader();
        
        // Apply body padding for header
        document.body.style.paddingTop = '60px';
    });
    
    // Listen for errors
    window.addEventListener('error', function(e) {
        APP_UTILS.log('Global error caught', 'error', e.error);
        
        // Always try to fix header when errors occur
        if (e.error && (e.error.toString().includes('style') || e.error.toString().includes('css'))) {
            fixHeader();
        }
    });
}

/**
 * Set up DOM observer to monitor changes and keep header fixed
 */
function setupDOMObserver() {
    APP_UTILS.log('Setting up DOM observer', 'info');
    
    // Create observer to react to DOM changes
    const observer = new MutationObserver(function(mutations) {
        let headerModified = false;
        let bodyModified = false;
        
        mutations.forEach(function(mutation) {
            // If attributes changed
            if (mutation.type === 'attributes' && 
                (mutation.attributeName === 'style' || mutation.attributeName === 'class')) {
                
                const target = mutation.target;
                
                // Check if header was modified
                if (target.tagName === 'HEADER' || 
                    (target.closest && target.closest('header'))) {
                    headerModified = true;
                }
                
                // Check if body was modified
                if (target.tagName === 'BODY') {
                    bodyModified = true;
                }
            }
            
            // If nodes were added or removed
            if (mutation.type === 'childList') {
                // Check added nodes
                mutation.addedNodes.forEach(node => {
                    if (node.nodeType === 1) { // Element node
                        if (node.tagName === 'HEADER' || 
                            (node.querySelector && node.querySelector('header'))) {
                            headerModified = true;
                        }
                    }
                });
            }
        });
        
        // Apply fixes if necessary
        if (headerModified) {
            APP_UTILS.log('🔄 Header was modified, reapplying fix', 'info');
            fixHeader();
        }
        
        if (bodyModified) {
            // Make sure body has padding for fixed header
            document.body.style.paddingTop = '60px';
        }
    });
    
    // Configure and start observer
    observer.observe(document.documentElement, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['style', 'class']
    });
    
    APP_UTILS.log('DOM observer active', 'success');
}

// Expose global utilities
window.appUtils = APP_UTILS; 