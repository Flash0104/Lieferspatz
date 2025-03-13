/**
 * UI Core - Handles basic UI functionality and initialization
 */

// Initialize UI when DOM is ready
document.addEventListener("DOMContentLoaded", function () {
    console.log("✅ UI Core initialized");
    
    // Initialize sidebar toggle
    initSidebar();
    
    // Setup global event listeners
    setupEventListeners();
    
    // Force header styling one last time
    setTimeout(function() {
        const header = document.querySelector('header');
        if (header) {
            header.setAttribute('style', `
                background: linear-gradient(to right, #0d9488, #0f766e) !important;
                background-image: none !important;
                background-blend-mode: normal !important;
                backdrop-filter: none !important;
                -webkit-backdrop-filter: none !important;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1) !important;
                position: fixed !important;
                width: 100% !important;
                top: 0 !important;
                z-index: 1000 !important;
            `);
        }
    }, 0);
});

/**
 * Initialize sidebar functionality
 */
function initSidebar() {
    const sidebarToggle = document.getElementById('sidebar-toggle');
    const closeSidebar = document.getElementById('close-sidebar');
    const navSidebar = document.getElementById('nav-sidebar');
    const navOverlay = document.getElementById('nav-overlay');
    
    if (!sidebarToggle || !navSidebar || !navOverlay) {
        console.warn("Sidebar elements not found");
        return;
    }
    
    console.log("🔄 Initializing sidebar toggle");
    
    // Open sidebar
    sidebarToggle.addEventListener('click', function() {
        console.log("🔄 Sidebar toggle clicked");
        navSidebar.style.transform = 'translateX(0)';
        navOverlay.style.display = 'block';
        setTimeout(() => {
            navOverlay.classList.add('active');
        }, 10);
        document.body.classList.add('nav-open');
    });
    
    // Close sidebar with X button
    if (closeSidebar) {
        closeSidebar.addEventListener('click', function() {
            closeNavSidebar();
        });
    }
    
    // Close sidebar with overlay
    navOverlay.addEventListener('click', function() {
        closeNavSidebar();
    });
    
    function closeNavSidebar() {
        navOverlay.classList.remove('active');
        setTimeout(() => {
            navSidebar.style.transform = 'translateX(-100%)';
            navOverlay.style.display = 'none';
        }, 300);
        document.body.classList.remove('nav-open');
    }
}

/**
 * Setup global event listeners
 */
function setupEventListeners() {
    // ESC key listener to close modals and sidebars
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            console.log("ESC key pressed");
            // Close cart if it's open
            if (typeof closeCart === 'function') {
                closeCart();
            }
            
            // Close sidebar if it's open
            const navSidebar = document.getElementById('nav-sidebar');
            const navOverlay = document.getElementById('nav-overlay');
            if (navSidebar && navOverlay && document.body.classList.contains('nav-open')) {
                navOverlay.classList.remove('active');
                setTimeout(() => {
                    navSidebar.style.transform = 'translateX(-100%)';
                    navOverlay.style.display = 'none';
                }, 300);
                document.body.classList.remove('nav-open');
            }
        }
    });
    
    // Add cleanup for unwanted images
    cleanupRogueImages();
}

/**
 * Clean up any rogue images that might be causing display issues
 */
function cleanupRogueImages() {
    // Function to hide unwanted images
    function hideUnwantedImages() {
        // Hide any large images that might be logos
        const images = document.querySelectorAll('img');
        images.forEach(function(img) {
            const src = img.getAttribute('src') || '';
            if ((src.includes('Lieferspatz.png') || 
                (src.includes('logo') && !src.includes('favicon.png'))) &&
                (img.width > 100 || img.height > 100)) {
                console.log('Hiding large logo image:', src);
                img.style.display = 'none';
            }
        });
        
        // Remove background images
        const elements = document.querySelectorAll('*');
        elements.forEach(function(el) {
            const style = window.getComputedStyle(el);
            const bg = style.backgroundImage;
            if (bg && (bg.includes('logo') || bg.includes('Lieferspatz') || bg.includes('orange'))) {
                console.log('Removing background image from:', el);
                el.style.backgroundImage = 'none';
            }
        });
        
        // Force body background
        document.body.style.backgroundColor = '#f3f4f6';
    }
    
    // Run cleanup after the page loads
    hideUnwantedImages();
    
    // Also run it after a short delay to catch dynamically loaded content
    setTimeout(hideUnwantedImages, 500);
    setTimeout(hideUnwantedImages, 1500);
    
    // Monitor for dynamically added elements
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.addedNodes.length) {
                hideUnwantedImages();
            }
        });
    });
    
    // Start observing
    observer.observe(document.body, { childList: true, subtree: true });
} 