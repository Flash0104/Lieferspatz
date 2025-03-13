/**
 * Sidebar and Cart Panel Fixes
 * This script fixes issues with both the navigation sidebar and cart panel
 */
document.addEventListener('DOMContentLoaded', function() {
    console.log('Sidebar fix script loaded');
    initNavSidebar();
    initCartSidebar();
    
    // Add body class to help with initial styling
    document.body.classList.add('sidebars-initialized');
    
    /**
     * Initialize Navigation Sidebar
     * Handles the left sidebar with navigation links
     */
    function initNavSidebar() {
        console.log('Initializing navigation sidebar');
        
        // Find all sidebar elements
        const sidebarToggle = document.getElementById('sidebar-toggle');
        const closeSidebar = document.getElementById('close-sidebar');
        const navSidebar = document.getElementById('nav-sidebar');
        const navOverlay = document.getElementById('nav-overlay');
        
        if (!sidebarToggle || !navSidebar || !navOverlay) {
            console.error('Navigation sidebar elements not found');
            return;
        }
        
        // Force reflow to ensure styles are applied
        void navSidebar.offsetWidth;
        
        // Open sidebar with animation
        function openNavSidebar() {
            console.log('Opening navigation sidebar');
            document.body.classList.add('nav-open');
            navOverlay.classList.add('active');
            navSidebar.style.transform = 'translateX(0)';
            
            // Animate nav links with staggered delay
            const navLinks = navSidebar.querySelectorAll('nav a');
            navLinks.forEach((link, index) => {
                setTimeout(() => {
                    link.style.opacity = '1';
                    link.style.transform = 'translateX(0)';
                }, 100 + (index * 50));
            });
        }
        
        // Close sidebar function
        function closeNavSidebar() {
            console.log('Closing navigation sidebar');
            navOverlay.classList.remove('active');
            navSidebar.style.transform = 'translateX(-100%)';
            
            // Reset link animations
            const navLinks = navSidebar.querySelectorAll('nav a');
            navLinks.forEach(link => {
                link.style.opacity = '0';
                link.style.transform = 'translateX(-10px)';
            });
            
            // Wait for animation to complete before removing class
            setTimeout(() => {
                document.body.classList.remove('nav-open');
            }, 300);
        }
        
        // Add event listeners
        sidebarToggle.addEventListener('click', openNavSidebar);
        
        if (closeSidebar) {
            closeSidebar.addEventListener('click', closeNavSidebar);
        }
        
        navOverlay.addEventListener('click', closeNavSidebar);
        
        // Close sidebar with escape key
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && document.body.classList.contains('nav-open')) {
                closeNavSidebar();
            }
        });
        
        // Add active class to current page link
        const currentPath = window.location.pathname;
        const navLinks = navSidebar.querySelectorAll('nav a');
        navLinks.forEach(link => {
            link.style.opacity = '0';
            link.style.transform = 'translateX(-10px)';
            link.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
            
            if (link.getAttribute('href') === currentPath) {
                link.classList.add('active');
                link.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
            }
        });
    }
    
    /**
     * Initialize Cart Sidebar
     * Handles the right sidebar with cart contents
     */
    function initCartSidebar() {
        console.log('Initializing cart sidebar');
        
        // Find all cart elements
        const cartBtn = document.getElementById('cart-btn');
        const closeCart = document.getElementById('close-cart');
        const cartSidebar = document.getElementById('cart-sidebar');
        const cartOverlay = document.getElementById('cart-overlay');
        
        if (!cartBtn || !cartSidebar || !cartOverlay) {
            console.error('Cart sidebar elements not found');
            return;
        }
        
        // Force reflow to ensure styles are applied
        void cartSidebar.offsetWidth;
        
        // Remove hidden class that might prevent transitions
        cartSidebar.classList.remove('hidden');
        cartOverlay.classList.remove('hidden');
        
        // Toggle cart sidebar
        function toggleCart() {
            console.log('Toggling cart sidebar');
            const isOpen = cartSidebar.classList.contains('active');
            
            if (isOpen) {
                // Close cart
                document.body.classList.remove('cart-open');
                cartSidebar.classList.remove('active');
                cartOverlay.classList.remove('active');
                cartSidebar.style.transform = 'translateX(100%)';
            } else {
                // Open cart
                document.body.classList.add('cart-open');
                cartSidebar.classList.add('active');
                cartOverlay.classList.add('active');
                cartSidebar.style.transform = 'translateX(0)';
                
                // Update cart contents
                updateCartContents();
            }
        }
        
        // Simple function to update cart contents
        function updateCartContents() {
            const cartItems = document.getElementById('cart-items');
            if (cartItems && cartItems.innerHTML === '<p class="text-center text-gray-500">Loading cart items...</p>') {
                // This would normally be an AJAX call to get cart contents
                console.log('Would fetch cart contents here');
            }
        }
        
        // Add event listeners
        cartBtn.addEventListener('click', function(e) {
            e.preventDefault();
            toggleCart();
        });
        
        if (closeCart) {
            closeCart.addEventListener('click', toggleCart);
        }
        
        cartOverlay.addEventListener('click', toggleCart);
        
        // Close cart with escape key
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && cartSidebar.classList.contains('active')) {
                toggleCart();
            }
        });
    }
}); 