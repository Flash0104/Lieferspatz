/**
 * High Priority Header Fix
 * This script runs on a timer to ensure the header is always fixed
 */

(function() {
    // Create an ID for our high priority fix
    const HIGH_PRIORITY_FIX_ID = 'high-priority-header-fix';
    
    // Function to apply the most critical fix
    function applyHighPriorityFix() {
        // Find header with multiple selectors to ensure we get it
        const header = document.querySelector('header') || 
                      document.querySelector('.header') || 
                      document.querySelector('nav.fixed') || 
                      document.querySelector('#main-header');
        
        if (header) {
            // Apply critical inline styles directly
            header.style.cssText = `
                position: fixed !important; 
                top: 0 !important; 
                left: 0 !important; 
                right: 0 !important; 
                width: 100% !important; 
                z-index: 9999 !important; 
                background: linear-gradient(to right, #0d9488, #0f766e) !important; 
                box-shadow: 0 2px 8px rgba(0,0,0,0.2) !important; 
                height: auto !important; 
                min-height: 60px !important; 
                display: block !important; 
                visibility: visible !important; 
                opacity: 1 !important; 
                transform: translateZ(0) !important;
            `;
            
            // Add data attributes and ID for CSS targeting
            header.setAttribute('data-fixed', 'true');
            if (!header.id) header.id = 'main-header';
        }
        
        // Always ensure body has proper padding
        if (document.body) {
            document.body.style.paddingTop = window.innerWidth <= 768 ? '50px' : '60px';
        }
    }
    
    // Function to create or update our style element
    function updateFixStyles() {
        let styleEl = document.getElementById(HIGH_PRIORITY_FIX_ID);
        
        if (!styleEl) {
            styleEl = document.createElement('style');
            styleEl.id = HIGH_PRIORITY_FIX_ID;
            document.head.appendChild(styleEl);
        }
        
        styleEl.textContent = `
            /* Ultra-specific selectors for maximum CSS specificity */
            html body header,
            body > header,
            header#main-header,
            header[data-fixed="true"],
            .header,
            nav.fixed,
            [role="banner"],
            #main-header {
                position: fixed !important;
                top: 0 !important;
                left: 0 !important;
                right: 0 !important;
                width: 100% !important;
                z-index: 9999 !important;
                height: auto !important;
                min-height: 60px !important;
                background: linear-gradient(to right, #0d9488, #0f766e) !important;
                box-shadow: 0 2px 8px rgba(0,0,0,0.2) !important;
                display: block !important;
                visibility: visible !important;
                opacity: 1 !important;
                transform: translateZ(0) !important;
                -webkit-transform: translateZ(0) !important;
            }
            
            /* Force body padding */
            body {
                padding-top: 60px !important;
                margin-top: 0 !important;
            }
            
            /* Mobile adjustments */
            @media (max-width: 768px) {
                html body header,
                body > header,
                header#main-header,
                header[data-fixed="true"],
                .header,
                nav.fixed {
                    min-height: 50px !important;
                }
                
                body {
                    padding-top: 50px !important;
                }
            }
        `;
    }
    
    // Schedule checks to ensure the fix stays applied
    function scheduleChecks() {
        // Initial fixes
        applyHighPriorityFix();
        updateFixStyles();
        
        // Run on a timer to keep checking
        setInterval(() => {
            applyHighPriorityFix();
            updateFixStyles();
        }, 500); // Check every 500ms
        
        // Check on all common events
        window.addEventListener('DOMContentLoaded', () => {
            applyHighPriorityFix();
            updateFixStyles();
        });
        
        window.addEventListener('load', () => {
            applyHighPriorityFix();
            updateFixStyles();
        });
        
        window.addEventListener('resize', () => {
            applyHighPriorityFix();
        });
        
        // Run again after a few seconds to catch any post-load changes
        setTimeout(() => {
            applyHighPriorityFix();
            updateFixStyles();
        }, 2000);
    }
    
    // Start the checking process
    scheduleChecks();
})(); 