/**
 * Emergency Header Fix - Ensures header is always visible and fixed
 */
(function() {
    // Store references to important elements
    let header = null;
    let styleElement = null;
    let observerActive = false;
    
    // Function to find the header element using multiple approaches
    function findHeader() {
        return document.querySelector('header') || 
               document.querySelector('.header') || 
               document.querySelector('nav.fixed') || 
               document.querySelector('#main-header') ||
               document.querySelector('.navigation-header') ||
               document.querySelector('[role="banner"]');
    }
    
    // Function to fix the header styling with maximum CSS specificity
    function applyHeaderFix() {
        console.log("Applying emergency header fix");
        
        // Try to find the header element using multiple approaches
        header = header || findHeader();
        
        if (!header) {
            // If header is not found, try again in next animation frame
            return requestAnimationFrame(applyHeaderFix);
        }
        
        // CRITICAL: First add attribute to ensure we can target it with CSS
        header.setAttribute('data-fixed', 'true');
        header.id = header.id || 'main-header';
        
        // Force override all styling properties with extremely high specificity
        const cssText = `
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            right: 0 !important;
            width: 100% !important;
            z-index: 9999 !important;
            background: linear-gradient(to right, #0d9488, #0f766e) !important;
            background-image: none !important;
            background-blend-mode: normal !important;
            backdrop-filter: none !important;
            -webkit-backdrop-filter: none !important;
            box-shadow: 0 2px 8px rgba(0,0,0,0.2) !important;
            height: auto !important;
            min-height: 60px !important;
            display: block !important;
            visibility: visible !important;
            opacity: 1 !important;
            transform: translateZ(0) !important;
            -webkit-transform: translateZ(0) !important;
            will-change: transform !important;
            contain: layout style !important;
        `;
        
        // Apply directly to header element for maximum specificity
        header.style.cssText = cssText;
        
        // ALSO add !important styles through a stylesheet for redundancy
        styleElement = styleElement || document.getElementById('header-emergency-fix');
        if (!styleElement) {
            styleElement = document.createElement('style');
            styleElement.id = 'header-emergency-fix';
            document.head.appendChild(styleElement);
        }
        
        styleElement.innerHTML = `
            /* Extreme specificity header fix */
            html body header,
            body > header,
            header#main-header,
            header[data-fixed="true"],
            header.fixed,
            header[role="banner"],
            [role="banner"],
            div > header,
            .header-wrapper header,
            #main-header {
                position: fixed !important;
                top: 0 !important;
                left: 0 !important;
                right: 0 !important;
                width: 100% !important;
                z-index: 9999 !important;
                background: linear-gradient(to right, #0d9488, #0f766e) !important;
                background-image: none !important;
                background-color: #0d9488 !important;
                box-shadow: 0 2px 8px rgba(0,0,0,0.2) !important;
                height: auto !important;
                min-height: 60px !important;
                display: block !important;
                visibility: visible !important;
                opacity: 1 !important;
                transform: translateZ(0) !important;
                -webkit-transform: translateZ(0) !important;
            }
            
            /* Force fix any potential background image issue */
            html body header::before, 
            html body header::after,
            header[data-fixed="true"]::before, 
            header[data-fixed="true"]::after {
                content: none !important;
                display: none !important;
                background: none !important;
            }
            
            /* Ensure header content is visible */
            html body header *, 
            header[data-fixed="true"] *,
            #main-header * {
                visibility: visible !important;
                opacity: 1 !important;
            }
            
            /* Force body padding to avoid content being hidden under header */
            body {
                padding-top: 60px !important;
                margin-top: 0 !important;
            }
            
            /* Fix for header display on mobile */
            @media (max-width: 768px) {
                html body header,
                header[data-fixed="true"],
                #main-header {
                    min-height: 50px !important;
                }
                
                body {
                    padding-top: 50px !important;
                }
            }
            
            /* Fix for Safari and iOS */
            @supports (-webkit-touch-callout: none) {
                html body header,
                header[data-fixed="true"],
                #main-header {
                    -webkit-transform: translateZ(0) !important;
                    transform: translateZ(0) !important;
                }
            }
        `;
        
        console.log("Emergency header fix style added");
        
        // Ensure the body has proper padding to account for fixed header
        const body = document.body;
        if (body) {
            body.style.paddingTop = '60px';
            
            // If screen is narrow (mobile), adjust padding
            if (window.innerWidth <= 768) {
                body.style.paddingTop = '50px';
            }
        }
        
        // Set up observer if not already done
        if (!observerActive && 'MutationObserver' in window) {
            setupObserver();
        }
    }
    
    // Function to set up mutation observer
    function setupObserver() {
        if (!header || observerActive) return;
        
        observerActive = true;
        
        // Create observer to watch for attribute changes on the header
        const observer = new MutationObserver(function(mutations) {
            let needsReapply = false;
            
            mutations.forEach(function(mutation) {
                if (mutation.type === 'attributes' && 
                   (mutation.attributeName === 'style' || 
                    mutation.attributeName === 'class' ||
                    mutation.attributeName === 'id')) {
                    needsReapply = true;
                }
            });
            
            if (needsReapply) {
                // Re-apply our fix if the header style changes
                requestAnimationFrame(applyHeaderFix);
            }
        });
        
        // Start observing
        observer.observe(header, { 
            attributes: true, 
            attributeFilter: ['style', 'class', 'id'] 
        });
        
        console.log("Header observer attached");
        
        // Also observe body element for changes
        const bodyObserver = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                if (mutation.type === 'childList' && mutation.addedNodes.length) {
                    // If nodes were added to body, check if our header is still fixed
                    requestAnimationFrame(checkHeaderStatus);
                }
            });
        });
        
        bodyObserver.observe(document.body, { 
            childList: true, 
            subtree: true 
        });
    }
    
    // Function to check if header is still properly styled
    function checkHeaderStatus() {
        if (!header) return;
        
        const computedStyle = window.getComputedStyle(header);
        
        // Check if position is still fixed
        if (computedStyle.position !== 'fixed') {
            console.log('Header position changed - reapplying fix');
            applyHeaderFix();
        }
        
        // Check z-index
        if (parseInt(computedStyle.zIndex) < 9999) {
            console.log('Header z-index changed - reapplying fix');
            applyHeaderFix();
        }
    }
    
    // Start fix immediately using requestAnimationFrame for better performance
    requestAnimationFrame(applyHeaderFix);
    
    // Apply again when DOM content is loaded
    document.addEventListener('DOMContentLoaded', function() {
        requestAnimationFrame(applyHeaderFix);
    });
    
    // Apply again after window loads (last resort)
    window.addEventListener('load', function() {
        requestAnimationFrame(applyHeaderFix);
        
        // Also check after a short delay to catch any post-load modifications
        setTimeout(function() {
            requestAnimationFrame(applyHeaderFix);
        }, 500);
    });
    
    // Apply fix on resize to handle responsive issues
    window.addEventListener('resize', function() {
        requestAnimationFrame(applyHeaderFix);
    });
    
    // Check periodically to ensure the header remains fixed
    setInterval(checkHeaderStatus, 2000);
})(); 