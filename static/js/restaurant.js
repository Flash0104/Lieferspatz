document.addEventListener("DOMContentLoaded", async function () {
    console.log("📥 Fetching menu items...");
    
    const restaurantId = window.location.pathname.split("/").pop(); // Get restaurant ID from URL
    const menuContainer = document.getElementById("menu-container");

    // Cart Elements
    const cartSidebar = document.getElementById('cart-sidebar');
    const cartOverlay = document.getElementById('cart-overlay');
    const cartButton = document.getElementById('cart-btn');
    const closeCartButton = document.getElementById('close-cart');
    
    // Add emergency close handler support
    if (closeCartButton) {
        closeCartButton.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log("NUCLEAR CLOSE: Close button clicked in restaurant.js");
            
            // Try to use the global function first
            if (typeof window.closeCart === 'function') {
                window.closeCart(e);
            } else {
                console.error("closeCart function not found! Using nuclear close method");
                
                // Force hide with the most aggressive approach
                const sidebar = document.getElementById('cart-sidebar');
                const overlay = document.getElementById('cart-overlay');
                
                // NUCLEAR OPTION: Actually remove the elements from DOM
                if (sidebar && sidebar.parentNode) {
                    console.log("NUCLEAR: Removing sidebar from DOM");
                    sidebar.parentNode.removeChild(sidebar);
                    
                    // Create hidden replacement to avoid errors
                    const newSidebar = document.createElement('div');
                    newSidebar.id = 'cart-sidebar';
                    newSidebar.style.display = 'none';
                    document.body.appendChild(newSidebar);
                }
                
                if (overlay && overlay.parentNode) {
                    console.log("NUCLEAR: Removing overlay from DOM");
                    overlay.parentNode.removeChild(overlay);
                    
                    // Create hidden replacement
                    const newOverlay = document.createElement('div');
                    newOverlay.id = 'cart-overlay';
                    newOverlay.style.display = 'none';
                    document.body.appendChild(newOverlay);
                }
                
                // Clean up any other cart-related elements that might be visible
                document.querySelectorAll('[id*="cart"]').forEach(el => {
                    if (el.id !== 'cart-btn' && el.id !== 'cart-bubble') {
                        el.style.display = 'none';
                    }
                });
                
                // Restore body scrolling
                document.body.style.overflow = '';
                document.documentElement.style.overflow = '';
                
                console.log("NUCLEAR close completed");
            }
            return false;
        }, true); // Use capturing phase for maximum priority
    }
    
    // Use the global cart functions from base.html
    async function addToCart(menuItemId) {
        console.log(`🛍️ Adding item ${menuItemId} to cart...`);
        
        // DIRECT UPDATE - Immediately show cart bubble with +1 before server response
        const cartBubble = document.getElementById('cart-bubble') || 
                           document.querySelector('.cart-bubble') || 
                           document.querySelector('[id$="cart-bubble"]');
                           
        if (cartBubble) {
            // Get current count
            let currentCount = parseInt(cartBubble.textContent) || 0;
            
            // Increment visually immediately
            currentCount++;
            
            // Update UI immediately for instant feedback
            cartBubble.textContent = currentCount;
            cartBubble.style.cssText = `
                display: flex !important;
                visibility: visible !important;
                opacity: 1 !important;
                background-color: #ef4444 !important;
                color: white !important;
                border-radius: 9999px !important;
                position: absolute !important;
                top: -8px !important;
                right: -8px !important;
                height: 20px !important;
                width: 20px !important;
                font-weight: bold !important;
                font-size: 12px !important;
                align-items: center !important;
                justify-content: center !important;
                z-index: 9999 !important;
            `;
            
            cartBubble.classList.remove('hidden', 'invisible');
            
            // Force browser repaint
            void cartBubble.offsetHeight;
        }
        
        // Now perform the actual server request
        try {
            const response = await fetch(`/cart/add/${menuItemId}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-Requested-With": "XMLHttpRequest"
                }
            });

            if (response.ok) {
                console.log("✅ Item added to cart successfully");
                
                // Update cart UI after server confirms
                await loadCartItems();
                
                // Double-check cart count with server for accuracy
                setTimeout(updateCartCount, 100);
                
                // Open the cart
                openCart();
                
                // Announce the change for any other components
                window.dispatchEvent(new CustomEvent('cartChanged', { 
                    detail: { action: 'add', itemId: menuItemId } 
                }));
                
                return true;
            } else {
                console.error("❌ Failed to add item to cart");
                
                // Reset the counter if request failed
                updateCartCount();
                return false;
            }
        } catch (error) {
            console.error("Error adding item to cart:", error);
            
            // Reset the counter if request failed
            updateCartCount();
            return false;
        }
    }

    async function updateCartCount() {
        console.log("🔄 Updating cart count...");
        try {
            const response = await fetch("/cart/count");
            const data = await response.json();
            const count = data.count || 0;
            
            console.log(`🛒 Cart count updated: ${count}`);
            
            // DIRECT DOM MANIPULATION - Find the bubble with multiple selector attempts
            const cartBubble = document.getElementById("cart-bubble") || 
                              document.querySelector(".cart-bubble") || 
                              document.querySelector("[id$='cart-bubble']");
            
            // Also try to find cart-count as fallback
            const cartCount = document.getElementById("cart-count") || 
                             document.querySelector(".cart-count") || 
                             document.querySelector("[id$='cart-count']");
                             
            // Force immediate rendering if we found the bubble
            if (cartBubble) {
                // Set text content
                cartBubble.textContent = count;
                
                // ALWAYS SHOW CART BUBBLE - Even when count is zero
                console.log(`🔵 Making cart bubble visible with count: ${count}`);
                
                // Clear any classes that might hide it
                cartBubble.classList.remove("hidden", "invisible", "opacity-0");
                cartBubble.classList.add("visible", "opacity-100");
                
                // Direct style manipulation with !important to override anything
                cartBubble.style.cssText = `
                    display: flex !important;
                    visibility: visible !important;
                    opacity: 1 !important;
                    background-color: #ef4444 !important;
                    color: white !important;
                    border-radius: 9999px !important;
                    position: absolute !important;
                    top: -8px !important;
                    right: -8px !important;
                    height: 20px !important;
                    width: 20px !important;
                    font-weight: bold !important;
                    font-size: 12px !important;
                    align-items: center !important;
                    justify-content: center !important;
                    z-index: 9999 !important;
                `;
                
                // Force browser repaint
                void cartBubble.offsetHeight;
                cartBubble.getBoundingClientRect();
                
                // Log the computed style to verify visibility
                const computedStyle = window.getComputedStyle(cartBubble);
                console.log(`Cart bubble computed style - display: ${computedStyle.display}, visibility: ${computedStyle.visibility}, opacity: ${computedStyle.opacity}`);
            } else {
                console.error("❌ Cart bubble element not found!");
            }
            
            // Also update cart-count element if it exists (for compatibility)
            if (cartCount && cartCount !== cartBubble) {
                cartCount.textContent = count;
                
                // Always show the cart count
                cartCount.classList.remove("hidden", "invisible", "opacity-0");
                cartCount.style.cssText = "display: flex !important; visibility: visible !important; opacity: 1 !important;";
            }
            
            return count;
        } catch (error) {
            console.error("Error updating cart count:", error);
            return 0;
        }
    }

    async function loadCartItems() {
        console.log("Loading cart items...");
        try {
            const response = await fetch("/api/cart");
            const data = await response.json();
            renderCartItems(data.items);
        } catch (error) {
            console.error("Error loading cart items:", error);
        }
    }

    function renderCartItems(cartItems) {
        console.log("Rendering cart items:", cartItems);
        const cartItemsContainer = document.getElementById("cart-items");
        if (!cartItemsContainer) return;
        
        cartItemsContainer.innerHTML = ""; // Clear existing content
        
        if (!cartItems || cartItems.length === 0) {
            cartItemsContainer.innerHTML = `
                <p class="text-gray-500 text-center py-8">Your cart is empty.</p>
            `;
            return;
        }
        
        // Create a container for cart items (can scroll)
        const itemsDiv = document.createElement('div');
        itemsDiv.className = 'flex-1 overflow-y-auto';
        
        // Calculate subtotal
        let subtotal = 0;
        
        // Add each item to the cart
        cartItems.forEach((item) => {
            const itemTotal = item.price * item.quantity;
            subtotal += itemTotal;
            
            const itemElement = document.createElement("div");
            itemElement.className = "flex justify-between items-center border-b py-3";
            itemElement.innerHTML = `
                <div class="flex-1">
                    <h3 class="font-medium">${item.name}</h3>
                    <div class="flex items-center">
                        <span class="text-gray-600">€${item.price.toFixed(2)} × ${item.quantity}</span>
                    </div>
                </div>
                <div class="flex items-center">
                    <span class="font-medium">€${itemTotal.toFixed(2)}</span>
                    <button class="remove-item ml-2 text-red-500 hover:text-red-700" data-id="${item.id}">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
                        </svg>
                    </button>
                </div>
            `;
            itemsDiv.appendChild(itemElement);
        });
        
        // Create fixed bottom section
        const bottomSection = document.createElement('div');
        bottomSection.className = 'border-t sticky bottom-0 bg-white pt-4';
        
        // Add summary and checkout
        const deliveryFee = 2.99;
        const total = subtotal + deliveryFee;
        
        bottomSection.innerHTML = `
            <div class="mt-2">
                <div class="flex justify-between mb-2">
                    <span class="text-gray-600">Subtotal:</span>
                    <span>€${subtotal.toFixed(2)}</span>
                </div>
                <div class="flex justify-between mb-2">
                    <span class="text-gray-600">Delivery Fee:</span>
                    <span>€${deliveryFee.toFixed(2)}</span>
                </div>
                <div class="flex justify-between font-bold text-lg mb-4">
                    <span>Total:</span>
                    <span>€${total.toFixed(2)}</span>
                </div>
                <a href="/checkout" class="block bg-teal-600 text-white text-center py-2 px-4 rounded-lg hover:bg-teal-700 transition">
                    Proceed to Checkout
                </a>
            </div>
        `;
        
        // Add both to container
        cartItemsContainer.appendChild(itemsDiv);
        cartItemsContainer.appendChild(bottomSection);
        
        // Add event listeners for remove buttons
        const removeButtons = cartItemsContainer.querySelectorAll(".remove-item");
        removeButtons.forEach((button) => {
            button.addEventListener("click", async (e) => {
                const itemId = button.getAttribute("data-id");
                await removeCartItem(itemId);
            });
        });
    }

    async function removeCartItem(itemId) {
        console.log("🗑️ Removing item from cart:", itemId);
        
        // DIRECT UPDATE - Immediately update cart bubble before server response
        const cartBubble = document.getElementById('cart-bubble') || 
                           document.querySelector('.cart-bubble') || 
                           document.querySelector('[id$="cart-bubble"]');
                           
        let currentCount = 0;
        
        if (cartBubble) {
            // Get current count
            currentCount = parseInt(cartBubble.textContent) || 0;
            
            // Decrement visually immediately
            if (currentCount > 0) {
                currentCount--;
            }
            
            // Update UI immediately for instant feedback
            cartBubble.textContent = currentCount;
            
            // ALWAYS SHOW CART BUBBLE - Even when count is zero
            cartBubble.style.cssText = `
                display: flex !important;
                visibility: visible !important;
                opacity: 1 !important;
                background-color: #ef4444 !important;
                color: white !important;
                border-radius: 9999px !important;
                position: absolute !important;
                top: -8px !important;
                right: -8px !important;
                height: 20px !important;
                width: 20px !important;
                font-weight: bold !important;
                font-size: 12px !important;
                align-items: center !important;
                justify-content: center !important;
                z-index: 9999 !important;
            `;
            
            // Remove any hiding classes
            cartBubble.classList.remove("hidden", "invisible", "opacity-0");
            
            // Force browser repaint
            void cartBubble.offsetHeight;
        }
        
        // Now perform the actual server request
        try {
            const response = await fetch(`/cart/remove/${itemId}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-Requested-With": "XMLHttpRequest"
                }
            });
            
            if (response.ok) {
                console.log("✅ Item removed from cart successfully");
                
                // Reload cart items
                await loadCartItems();
                
                // Double-check cart count with server for accuracy
                const count = await updateCartCount();
                
                // Announce the change for any other components
                window.dispatchEvent(new CustomEvent('cartChanged', { 
                    detail: { action: 'remove', itemId: itemId } 
                }));
                
                // If cart is now empty, close it
                if (count === 0) {
                    console.log("🛒 Cart is now empty, closing cart");
                    
                    // Try multiple closing approaches for reliability
                    if (typeof window.closeCart === 'function') {
                        window.closeCart();
                    } else if (typeof window.forceCloseCart === 'function') {
                        window.forceCloseCart();
                    } else {
                        // Direct close as fallback
                        const sidebar = document.getElementById('cart-sidebar');
                        const overlay = document.getElementById('cart-overlay');
                        
                        if (sidebar) sidebar.style.cssText = "display: none !important; transform: translateX(100%) !important;";
                        if (overlay) overlay.style.cssText = "display: none !important;";
                        
                        document.body.style.overflow = '';
                    }
                }
                
                return true;
            } else {
                console.error("❌ Failed to remove item from cart");
                
                // Reset the counter if request failed
                updateCartCount();
                return false;
            }
        } catch (error) {
            console.error("❌ Error removing item from cart:", error);
            
            // Reset the counter if request failed
            updateCartCount();
            return false;
        }
    }

    // Initialize
    updateCartCount();
    
    // Load menu items
    try {
        const response = await fetch(`/api/restaurant/${restaurantId}/menu`);
        const data = await response.json();
        console.log("Menu data:", data);
        
        // Add event listeners to "Add to Cart" buttons
        document.querySelectorAll(".add-to-cart").forEach((button) => {
            button.addEventListener("click", (e) => {
                const itemId = button.getAttribute("data-id");
                addToCart(itemId);
            });
        });
    } catch (error) {
        console.error("Error loading menu items:", error);
    }

    // Super aggressive emergency close handler
    document.addEventListener('click', function(e) {
        if (e.target.id === 'close-cart' || e.target.closest('#close-cart')) {
            e.preventDefault();
            e.stopPropagation();
            console.log("🛒 Emergency close handler triggered");
            
            // Try calling global closeCart first
            if (typeof window.closeCart === 'function') {
                window.closeCart();
            } else {
                console.log("⚠️ No global closeCart function, using nuclear method");
                const cartSidebar = document.getElementById('cart-sidebar');
                const cartOverlay = document.getElementById('cart-overlay');
                
                if (cartSidebar) {
                    cartSidebar.classList.remove('visible');
                    cartSidebar.style.transform = 'translateX(100%)';
                }
                
                if (cartOverlay) {
                    cartOverlay.classList.remove('visible');
                    cartOverlay.style.display = 'none';
                }
                
                // Restore body scrolling
                document.body.style.overflow = '';
                document.body.classList.remove('cart-open');
            }
        }
    });
    
    // Extra close handler for the emergency button
    document.addEventListener('click', function(e) {
        if (e.target.id === 'emergency-close-cart') {
            e.preventDefault();
            e.stopPropagation();
            console.log("🛒 Emergency button close handler triggered");
            
            // Try calling global closeCart first
            if (typeof window.closeCart === 'function') {
                window.closeCart();
            } else {
                console.log("⚠️ No global closeCart function, using nuclear method");
                const cartSidebar = document.getElementById('cart-sidebar');
                const cartOverlay = document.getElementById('cart-overlay');
                
                if (cartSidebar) {
                    cartSidebar.classList.remove('visible');
                    cartSidebar.style.transform = 'translateX(100%)';
                }
                
                if (cartOverlay) {
                    cartOverlay.classList.remove('visible');
                    cartOverlay.style.display = 'none';
                }
                
                // Restore body scrolling
                document.body.style.overflow = '';
                document.body.classList.remove('cart-open');
            }
        }
    });
});
