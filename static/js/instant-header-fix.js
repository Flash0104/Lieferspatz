/**
 * Lieferspatz Instant Header Fix
 * This script runs immediately in the <head> before any DOM content loads
 * to ensure the header styling is applied without any flash or delay
 */

(function() {
    // Create and inject critical style rules immediately
    const style = document.createElement('style');
    style.id = 'instant-header-fix';
    style.textContent = `
        /* Critical header styling */
        header, .header, nav.fixed {
            background: linear-gradient(to right, #0d9488, #0f766e) !important;
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            right: 0 !important;
            width: 100% !important;
            height: auto !important;
            min-height: 60px !important;
            z-index: 1000 !important;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1) !important;
            display: block !important;
            visibility: visible !important;
            opacity: 1 !important;
            transform: translateZ(0) !important;
            -webkit-transform: translateZ(0) !important;
            will-change: transform !important;
            contain: layout style !important;
        }
        
        /* Ensure body has padding to account for fixed header */
        body {
            padding-top: 60px !important;
        }
        
        /* Hide any potential flash of unstyled header */
        header::before, header::after,
        .header::before, .header::after {
            display: none !important;
            content: none !important;
        }
        
        /* Ensure header content is visible */
        header *, .header * {
            opacity: 1 !important;
            visibility: visible !important;
        }
        
        /* Fix for mobile devices */
        @media (max-width: 768px) {
            header, .header {
                min-height: 50px !important;
            }
            
            body {
                padding-top: 50px !important;
            }
        }
    `;
    
    // Add style to head immediately
    document.head.appendChild(style);
    
    // Function to apply styles directly to header when it becomes available
    function applyHeaderStyles() {
        const header = document.querySelector('header') || document.querySelector('.header');
        if (!header) return;
        
        // Apply styles directly to the element for maximum specificity
        Object.assign(header.style, {
            background: 'linear-gradient(to right, #0d9488, #0f766e)',
            position: 'fixed',
            top: '0',
            left: '0',
            right: '0',
            width: '100%',
            zIndex: '1000',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            visibility: 'visible',
            display: 'block',
            opacity: '1',
            transform: 'translateZ(0)',
            WebkitTransform: 'translateZ(0)',
            minHeight: '60px',
            height: 'auto'
        });
    }
    
    // Try to apply header styles as soon as possible
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', applyHeaderStyles);
    } else {
        applyHeaderStyles();
    }
    
    // Also apply on load as a fallback
    window.addEventListener('load', applyHeaderStyles);
    
    // Run immediately too in case DOM is already available
    setTimeout(applyHeaderStyles, 0);
    
    // Setup MutationObserver to monitor and fix header as soon as it appears
    if ('MutationObserver' in window) {
        const observer = new MutationObserver(function(mutations) {
            for (const mutation of mutations) {
                if (mutation.addedNodes.length) {
                    applyHeaderStyles();
                }
            }
        });
        
        if (document.body) {
            observer.observe(document.body, { childList: true, subtree: true });
        } else {
            document.addEventListener('DOMContentLoaded', function() {
                observer.observe(document.body, { childList: true, subtree: true });
            });
        }
    }
})();
