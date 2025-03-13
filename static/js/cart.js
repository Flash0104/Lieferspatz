/**
 * Cart Module - Handles all cart-related functionality
 */

// Initialize cart functionality when DOM is ready
document.addEventListener("DOMContentLoaded", function() {
    console.log("🛒 Cart Module Initialized");
    
    // Initialize core cart functionality
    initializeCart();
    
    // Update cart count on page load
    updateCartCount();
    
    // Add click event to cart button to show cart
    const cartBtn = document.getElementById("cart-btn");
    if (cartBtn) {
        console.log("🛒 Adding click event to cart button");
        cartBtn.addEventListener("click", function(e) {
            e.preventDefault();
            e.stopPropagation();
            toggleCartPanel();
            return false;
        });
        
        // Make cart button more visible
        cartBtn.style.cssText = `
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            position: relative !important;
            width: 30px !important;
            height: 30px !important;
            color: white !important;
            background-color: transparent !important;
            cursor: pointer !important;
            z-index: 1001 !important;
            visibility: visible !important;
            opacity: 1 !important;
        `;
    }
    
    // Initialize close button and overlay for cart panel
    const closeCartBtn = document.getElementById('close-cart');
    if (closeCartBtn) {
        closeCartBtn.addEventListener("click", function(e) {
            e.preventDefault();
            e.stopPropagation();
            closeCart();
        });
    }
    
    const cartOverlay = document.getElementById('cart-overlay');
    if (cartOverlay) {
        cartOverlay.addEventListener('click', function(e) {
            e.preventDefault();
            closeCart();
        });
    }
    
    // Check and update cart every 30 seconds
    setInterval(updateCartCount, 30000);
    
    // Also update cart after each page interaction
    document.addEventListener('click', function() {
        setTimeout(updateCartCount, 1000);
    });
});

/**
 * Cart count update function 
 */
async function updateCartCount() {
    console.log("🔄 updateCartCount called");
    try {
        // Use no-cache to ensure we get fresh data
        const response = await fetch('/cart/count', {
            method: 'GET',
            headers: {
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0'
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            const count = data.count || 0;
            console.log(`🛒 Cart count from API: ${count}`);
            
            // MULTIPLE SELECTORS - Find all possible cart indicators
            const allSelectors = [
                '#cart-bubble', '.cart-bubble', '[id$="cart-bubble"]',
                '#cart-count', '.cart-count', '[id$="cart-count"]'
            ];
            
            let foundElement = false;
            
            // Try each selector until we find an element
            for (const selector of allSelectors) {
                const elements = document.querySelectorAll(selector);
                
                if (elements.length > 0) {
                    console.log(`Found ${elements.length} elements with selector: ${selector}`);
                    foundElement = true;
                    
                    elements.forEach(element => {
                        // Set text content
                        element.textContent = count;
                        
                        // ALWAYS SHOW CART BUBBLE - Even when count is zero
                        // Remove any hiding classes
                        element.classList.remove('hidden', 'invisible', 'opacity-0');
                        
                        // Force visibility with ALL possible style properties
                        element.style.cssText = `
                            display: flex !important;
                            visibility: visible !important;
                            opacity: 1 !important;
                            position: absolute !important;
                            top: -8px !important;
                            right: -8px !important;
                            background-color: #ef4444 !important;
                            color: white !important;
                            border-radius: 50% !important;
                            height: 20px !important; 
                            width: 20px !important;
                            align-items: center !important;
                            justify-content: center !important;
                            font-weight: bold !important;
                            font-size: 12px !important;
                            z-index: 9999 !important;
                            pointer-events: none !important;
                        `;
                    });
                }
            }
            
            // If no elements were found through selectors, create one as a fallback
            if (!foundElement) {
                console.log("No cart bubble found, creating one");
                const cartBtn = document.getElementById('cart-btn');
                
                if (cartBtn) {
                    // Check if bubble already exists as a child
                    let bubble = cartBtn.querySelector('.cart-bubble, #cart-bubble');
                    
                    if (!bubble) {
                        // Create new bubble
                        bubble = document.createElement('span');
                        bubble.id = 'cart-bubble';
                        bubble.className = 'cart-bubble absolute -top-2 -right-2 bg-red-500 text-white rounded-full h-5 w-5 flex items-center justify-center text-xs font-bold';
                        cartBtn.appendChild(bubble);
                    }
                    
                    // Update and ensure visibility
                    bubble.textContent = count;
                    bubble.style.cssText = `
                        display: flex !important;
                        visibility: visible !important;
                        opacity: 1 !important;
                        position: absolute !important;
                        top: -8px !important;
                        right: -8px !important;
                        background-color: #ef4444 !important;
                        color: white !important;
                        border-radius: 50% !important;
                        height: 20px !important; 
                        width: 20px !important;
                        align-items: center !important;
                        justify-content: center !important;
                        font-weight: bold !important;
                        font-size: 12px !important;
                        z-index: 9999 !important;
                    `;
                }
            }
            
            return count;
        }
    } catch (error) {
        console.error("Error updating cart count:", error);
        return 0;
    }
}

/**
 * Toggle cart panel visibility
 */
function toggleCartPanel() {
    console.log("🛒 Toggling cart panel");
    const cartSidebar = document.getElementById('cart-sidebar');
    const cartOverlay = document.getElementById('cart-overlay');
    
    if (!cartSidebar || !cartOverlay) {
        console.error("Cart sidebar or overlay not found in DOM");
        return;
    }
    
    // Force cart panel elements to be visible in DOM
    cartSidebar.style.display = 'block';
    cartSidebar.style.visibility = 'visible';
    cartOverlay.style.display = 'block';
    
    // Toggle the active class for animation
    const isActive = cartSidebar.classList.contains('active');
    
    if (!isActive) {
        // Opening cart
        console.log("Opening cart sidebar");
        
        // Add classes for active state
        cartSidebar.classList.add('active');
        cartOverlay.classList.add('active');
        document.body.classList.add('cart-open');
        
        // Force styles with !important to ensure visibility
        cartSidebar.style.cssText = `
            display: block !important;
            visibility: visible !important;
            opacity: 1 !important;
            transform: translateX(0) !important;
            z-index: 1001 !important;
        `;
        
        cartOverlay.style.cssText = `
            display: block !important;
            visibility: visible !important;
            opacity: 1 !important;
            z-index: 1000 !important;
        `;
        
        // Load cart items
        loadCartItems();
    } else {
        // Closing cart
        console.log("Closing cart sidebar");
        
        // Remove active classes
        cartSidebar.classList.remove('active');
        cartOverlay.classList.remove('active');
        document.body.classList.remove('cart-open');
        
        // First update transform and opacity
        cartSidebar.style.transform = 'translateX(100%)';
        cartOverlay.style.opacity = '0';
        
        // After transition, update display property
        setTimeout(() => {
            // Only hide overlay, keep sidebar in DOM but transformed away
            cartOverlay.style.visibility = 'hidden';
        }, 300);
    }
}

/**
 * Global functions for opening and closing cart
 */
window.openCart = function() {
    console.log("Global openCart called");
    const cartSidebar = document.getElementById('cart-sidebar');
    
    if (cartSidebar && !cartSidebar.classList.contains('active')) {
        toggleCartPanel();
    }
};

window.closeCart = function() {
    console.log("Global closeCart called");
    const cartSidebar = document.getElementById('cart-sidebar');
    
    if (cartSidebar && cartSidebar.classList.contains('active')) {
        toggleCartPanel();
    }
};

/**
 * Add to cart function
 */
window.addToCart = async function(itemId, quantity = 1) {
    try {
        const response = await fetch(`/cart/add/${itemId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            },
            body: JSON.stringify({ quantity })
        });
        
        if (response.ok) {
            updateCartCount();
            return true;
        }
        return false;
    } catch (error) {
        console.error("Error adding to cart:", error);
        return false;
    }
};

/**
 * Load cart items
 */
function loadCartItems() {
    console.log("🛒 Loading cart items");
    const cartItems = document.getElementById('cart-items');
    
    if (!cartItems) {
        console.error("Cart items container not found");
        return;
    }
    
    // Display loading indicator
    cartItems.innerHTML = '<p class="text-center py-4">Loading your cart...</p>';
    
    // Fetch cart data
    fetch('/cart', {
        method: 'GET',
        headers: {
            'Cache-Control': 'no-cache',
            'X-Requested-With': 'XMLHttpRequest'
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.items && data.items.length > 0) {
            // Render cart items
            let html = '<div class="grid grid-cols-1 gap-4">';
            
            data.items.forEach(item => {
                html += `
                <div class="cart-item p-3 border-b border-gray-200 flex items-center justify-between">
                    <div>
                        <h3 class="font-medium">${item.name}</h3>
                        <p class="text-sm text-gray-600">${item.quantity} × €${(item.price).toFixed(2)}</p>
                    </div>
                    <div class="flex items-center">
                        <span class="font-semibold">€${(item.price * item.quantity).toFixed(2)}</span>
                        <button 
                            onclick="removeFromCart(${item.id})"
                            class="ml-2 p-1 text-red-500 hover:bg-red-100 rounded-full"
                        >
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                            </svg>
                        </button>
                    </div>
                </div>
                `;
            });
            
            html += '</div>';
            
            // Add total price
            html += `
            <div class="mt-4 border-t border-gray-200 pt-4">
                <div class="flex justify-between font-semibold">
                    <span>Total:</span>
                    <span>€${data.total_price.toFixed(2)}</span>
                </div>
                <a href="/checkout" class="mt-4 w-full bg-teal-600 text-white py-2 px-4 rounded-lg text-center block hover:bg-teal-700 transition">
                    Checkout
                </a>
            </div>
            `;
            
            cartItems.innerHTML = html;
        } else {
            // Empty cart
            cartItems.innerHTML = `
            <div class="py-8 text-center">
                <svg class="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path>
                </svg>
                <p class="text-gray-500">Your cart is empty</p>
                <a href="/" class="mt-4 inline-block bg-teal-600 text-white py-2 px-4 rounded-lg hover:bg-teal-700 transition">
                    Browse Restaurants
                </a>
            </div>
            `;
        }
    })
    .catch(error => {
        console.error("Error loading cart:", error);
        cartItems.innerHTML = '<p class="text-center text-red-500 py-4">Error loading cart. Please try again.</p>';
    });
}

/**
 * Remove item from cart
 */
window.removeFromCart = function(itemId) {
    fetch(`/cart/remove/${itemId}`, {
        method: 'POST',
        headers: {
            'X-Requested-With': 'XMLHttpRequest'
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Reload cart items
            loadCartItems();
            // Update cart count
            updateCartCount();
        }
    })
    .catch(error => {
        console.error("Error removing item:", error);
    });
};

/**
 * Initialize cart panel
 */
function initializeCart() {
    console.log("🛒 Initializing cart functionality");
    
    // Make sure cart elements exist in DOM
    const cartSidebar = document.getElementById('cart-sidebar');
    const cartOverlay = document.getElementById('cart-overlay');
    
    if (!cartSidebar) {
        console.log("Creating cart sidebar");
        
        // Create cart sidebar
        const sidebar = document.createElement('div');
        sidebar.id = 'cart-sidebar';
        sidebar.className = 'fixed top-0 right-0 w-80 max-w-sm h-full bg-white shadow-lg transform translate-x-full transition duration-300 ease-in-out z-50';
        
        sidebar.innerHTML = `
        <div class="p-4 border-b border-gray-200 flex justify-between items-center">
            <h2 class="text-xl font-semibold">Your Cart</h2>
            <button id="close-cart" class="text-gray-500 hover:text-gray-700">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
            </button>
        </div>
        <div id="cart-items" class="p-4 overflow-y-auto" style="max-height: calc(100vh - 8rem);">
            <p class="text-center py-4">Loading your cart...</p>
        </div>
        `;
        
        document.body.appendChild(sidebar);
    }
    
    if (!cartOverlay) {
        console.log("Creating cart overlay");
        
        // Create cart overlay
        const overlay = document.createElement('div');
        overlay.id = 'cart-overlay';
        overlay.className = 'fixed inset-0 bg-black bg-opacity-50 z-40 hidden';
        
        document.body.appendChild(overlay);
        
        // Add event listener to overlay
        overlay.addEventListener('click', closeCart);
    }
    
    // Ensure the close button works
    const closeBtn = document.getElementById('close-cart');
    if (closeBtn) {
        closeBtn.addEventListener('click', function(e) {
            e.preventDefault();
            closeCart();
        });
    }
    
    // Load cart items on initial sidebar creation
    loadCartItems();
} 