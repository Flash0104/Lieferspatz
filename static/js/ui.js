/**
 * UI Module - Handles general UI components and interactions
 */

document.addEventListener("DOMContentLoaded", function() {
    console.log("🎨 UI Module Initialized");
    
    // Initialize the sidebar functionality
    initializeSidebar();
    
    // Fix the header styling immediately
    fixHeaderStyling();
    
    // Apply body background
    applyBodyBackground();
    
    // Setup any responsive UI elements
    setupResponsiveUI();
    
    // Fix any rogue images/elements that might be causing display issues
    cleanupRogueElements();
    
    // Set up MutationObserver to monitor DOM changes
    setupMutationObserver();
});

/**
 * Initialize the sidebar toggle functionality
 */
function initializeSidebar() {
    console.log("🎨 Initializing sidebar functionality");
    
    // Find all sidebar toggle buttons
    const toggleButtons = document.querySelectorAll('.sidebar-toggle, #sidebar-toggle, [id$="sidebar-toggle"], [data-action="toggle-sidebar"]');
    
    toggleButtons.forEach(button => {
        console.log("🎨 Adding click event to sidebar toggle", button);
        
        button.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            console.log("🎨 Sidebar toggle clicked");
            
            const sidebar = document.querySelector('.sidebar, #sidebar, [id$="sidebar"]');
            const overlay = document.querySelector('.sidebar-overlay, #sidebar-overlay');
            
            if (sidebar) {
                sidebar.classList.toggle('active');
                sidebar.style.transform = sidebar.classList.contains('active') ? 'translateX(0)' : 'translateX(-100%)';
                sidebar.style.visibility = sidebar.classList.contains('active') ? 'visible' : 'hidden';
                
                if (overlay) {
                    overlay.classList.toggle('active');
                    overlay.style.display = sidebar.classList.contains('active') ? 'block' : 'none';
                }
                
                document.body.classList.toggle('sidebar-open');
            }
        });
    });
    
    // Set up click event on overlay to close sidebar
    const overlay = document.querySelector('.sidebar-overlay, #sidebar-overlay');
    if (overlay) {
        overlay.addEventListener('click', function() {
            const sidebar = document.querySelector('.sidebar, #sidebar, [id$="sidebar"]');
            if (sidebar) {
                sidebar.classList.remove('active');
                sidebar.style.transform = 'translateX(-100%)';
                overlay.classList.remove('active');
                overlay.style.display = 'none';
                document.body.classList.remove('sidebar-open');
            }
        });
    }
}

/**
 * Fix header styling - ensures header is visible and styled correctly
 */
function fixHeaderStyling() {
    console.log("🎨 Fixing header styling");
    
    // Target the header element
    const header = document.querySelector('header');
    
    if (header) {
        console.log("🎨 Header found, applying fixes");
        
        // Force header to have gradient background and be visible
        header.style.cssText = `
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            width: 100% !important;
            z-index: 1000 !important;
            background: linear-gradient(to right, #0d9488, #0f766e) !important;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1) !important;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1) !important;
            visibility: visible !important;
            opacity: 1 !important;
            min-height: 60px !important;
            display: flex !important;
            align-items: center !important;
            padding: 0 1rem !important;
        `;
        
        // Remove any background images or blend modes that might be affecting appearance
        header.style.backgroundImage = 'none !important';
        header.style.backgroundBlendMode = 'normal !important';
        header.style.backdropFilter = 'none !important';
        
        // Fix header container
        const headerContainer = header.querySelector('.container');
        if (headerContainer) {
            headerContainer.style.cssText = `
                display: flex !important;
                align-items: center !important;
                justify-content: space-between !important;
                width: 100% !important;
                padding: 0 1rem !important;
                max-width: 1280px !important;
                margin: 0 auto !important;
                position: relative !important;
                z-index: 10 !important;
            `;
        }
        
        // Ensure logo is visible
        const logo = header.querySelector('.logo, #logo, [id$="logo"]');
        if (logo) {
            logo.style.cssText = `
                display: block !important;
                visibility: visible !important;
                opacity: 1 !important;
                max-height: 40px !important;
                width: auto !important;
                z-index: 12 !important;
            `;
        }
        
        // Ensure cart button is visible
        const cartBtn = header.querySelector('#cart-btn, .cart-btn, [id$="cart-btn"]');
        if (cartBtn) {
            cartBtn.style.cssText = `
                display: flex !important;
                visibility: visible !important;
                opacity: 1 !important;
                z-index: 1001 !important;
                position: relative !important;
            `;
        }
        
        // Log that we've fixed the header
        console.log("🎨 Header styling fixed");
    } else {
        console.warn("🎨 Header element not found, unable to apply fixes");
    }
}

/**
 * Apply consistent body background
 */
function applyBodyBackground() {
    console.log("🎨 Applying body background");
    
    // Apply a clean gray background without textures
    document.body.style.cssText = `
        background-color: #f3f4f6 !important;
        background-image: none !important;
        padding-top: 60px !important; /* Account for fixed header */
    `;
    
    // If there was a ::before pseudo-element, we need to add this via actual element
    // since we can't style pseudo-elements with JS
    const bodyOverlay = document.createElement('div');
    bodyOverlay.id = 'body-background-overlay';
    bodyOverlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        z-index: -1;
        background-color: rgba(243, 244, 246, 0.5);
        pointer-events: none;
    `;
    
    // Only append if it doesn't already exist
    if (!document.getElementById('body-background-overlay')) {
        document.body.appendChild(bodyOverlay);
    }
}

/**
 * Set up responsive UI elements
 */
function setupResponsiveUI() {
    console.log("🎨 Setting up responsive UI");
    
    // Handle responsive navigation
    const mobileMenuButtons = document.querySelectorAll('.mobile-menu-button, #mobile-menu-button, [id$="mobile-menu-button"]');
    
    mobileMenuButtons.forEach(button => {
        button.addEventListener('click', function() {
            const mobileMenu = document.querySelector('.mobile-menu, #mobile-menu, [id$="mobile-menu"]');
            if (mobileMenu) {
                mobileMenu.classList.toggle('active');
                const isActive = mobileMenu.classList.contains('active');
                mobileMenu.style.display = isActive ? 'block' : 'none';
                mobileMenu.style.visibility = isActive ? 'visible' : 'hidden';
                mobileMenu.style.opacity = isActive ? '1' : '0';
            }
        });
    });
    
    // Handle responsive search form
    const searchToggle = document.querySelector('.search-toggle, #search-toggle, [id$="search-toggle"]');
    if (searchToggle) {
        searchToggle.addEventListener('click', function() {
            const searchForm = document.querySelector('.search-form, #search-form, [id$="search-form"]');
            if (searchForm) {
                searchForm.classList.toggle('active');
                searchForm.style.display = searchForm.classList.contains('active') ? 'block' : 'none';
                
                if (searchForm.classList.contains('active')) {
                    const searchInput = searchForm.querySelector('input[type="search"]');
                    if (searchInput) {
                        setTimeout(() => searchInput.focus(), 100);
                    }
                }
            }
        });
    }
}

/**
 * Clean up rogue elements that might be causing display issues
 */
function cleanupRogueElements() {
    console.log("🎨 Cleaning up rogue elements");
    
    // Fix any large logo images that might be pushing content down
    const largeLogos = document.querySelectorAll('img[src*="logo"], .logo img, #logo img');
    largeLogos.forEach(logo => {
        if (logo.offsetHeight > 80) {
            console.log("🎨 Fixing oversized logo", logo);
            logo.style.maxHeight = '40px';
            logo.style.width = 'auto';
        }
    });
    
    // Remove background images from body and main elements that might be causing issues
    document.querySelectorAll('body, main, .main-content, #main-content').forEach(el => {
        const computedStyle = window.getComputedStyle(el);
        if (computedStyle.backgroundImage && computedStyle.backgroundImage !== 'none') {
            console.log("🎨 Removing background image from", el);
            el.style.backgroundImage = 'none';
        }
    });
    
    // Fix z-index issues by setting appropriate z-index on all major UI components
    document.querySelectorAll('header, footer, .sidebar, #sidebar, .overlay, #overlay').forEach((el, index) => {
        const tagName = el.tagName.toLowerCase();
        
        // Assign z-index based on element type
        let zIndex;
        if (tagName === 'header') zIndex = 1000;
        else if (el.id === 'sidebar' || el.classList.contains('sidebar')) zIndex = 900;
        else if (tagName === 'footer') zIndex = 500;
        else if (el.id === 'overlay' || el.classList.contains('overlay')) zIndex = 800;
        else zIndex = 10;
        
        console.log(`🎨 Setting z-index ${zIndex} for ${tagName}#${el.id || 'no-id'}`);
        el.style.zIndex = zIndex.toString();
    });
}

/**
 * Set up a MutationObserver to monitor DOM changes
 * This helps ensure our UI fixes are applied even if content is loaded dynamically
 */
function setupMutationObserver() {
    console.log("🎨 Setting up MutationObserver");
    
    // Create a mutation observer to watch for changes to the DOM
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            // If nodes are added to the DOM
            if (mutation.type === 'childList' && mutation.addedNodes.length) {
                console.log("🎨 DOM modified, re-applying UI fixes");
                
                // Check for new sidebar toggle buttons and attach events
                mutation.addedNodes.forEach(node => {
                    if (node.nodeType === 1) { // Element node
                        // Check if this is a sidebar toggle or contains one
                        const toggles = node.classList && node.classList.contains('sidebar-toggle') ? 
                            [node] : node.querySelectorAll ? node.querySelectorAll('.sidebar-toggle') : [];
                        
                        toggles.forEach(toggle => {
                            console.log("🎨 Adding click event to new sidebar toggle", toggle);
                            toggle.addEventListener('click', function(e) {
                                e.preventDefault();
                                const sidebar = document.querySelector('.sidebar, #sidebar');
                                if (sidebar) sidebar.classList.toggle('active');
                            });
                        });
                        
                        // Clean up any rogue elements
                        cleanupRogueElements();
                        
                        // Re-fix header styling if it was modified
                        if (node.nodeName === 'HEADER' || node.querySelector('header')) {
                            fixHeaderStyling();
                        }
                    }
                });
            }
            
            // If attributes (like style or class) are modified
            if (mutation.type === 'attributes') {
                const target = mutation.target;
                
                // If the header or its children have attributes changed, re-apply fixes
                if (target.nodeName === 'HEADER' || 
                    (target.closest && target.closest('header'))) {
                    console.log("🎨 Header attributes modified, re-applying fixes");
                    fixHeaderStyling();
                }
            }
        });
    });
    
    // Start observing the document with the configured parameters
    observer.observe(document.body, { 
        childList: true,      // Watch for child node additions/removals
        subtree: true,        // Watch the entire subtree
        attributes: true,     // Watch for changes to attributes
        attributeFilter: ['style', 'class'] // Only care about style and class changes
    });
    
    // Log that we've set up the observer
    console.log("🎨 MutationObserver now watching for DOM changes");
} 