// Main JavaScript file - contains all essential functionality

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
  // Simple cart functionality
  const cartCount = document.getElementById('cart-count');
  const cartToggle = document.getElementById('cart-toggle');
  const cartSidebar = document.getElementById('cart-sidebar');
  const closeCart = document.getElementById('close-cart');
  const overlay = document.getElementById('overlay');
  const mobileMenu = document.getElementById('mobile-menu');
  const navbarToggle = document.getElementById('navbar-toggle');
  
  // Function to update cart count
  function updateCartCount() {
    fetch('/cart/count')
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .then(data => {
        if (cartCount) {
          cartCount.textContent = data.count || '0';
        }
      })
      .catch(error => {
        console.error('Error fetching cart count:', error);
      });
  }
  
  // Update cart count on page load
  updateCartCount();
  
  // Navbar toggle functionality
  if (navbarToggle && mobileMenu && overlay) {
    navbarToggle.addEventListener('click', function() {
      // Toggle mobile menu
      if (mobileMenu.classList.contains('hidden')) {
        mobileMenu.classList.remove('hidden');
        overlay.classList.remove('hidden');
        document.body.classList.add('overflow-hidden');
      } else {
        mobileMenu.classList.add('hidden');
        overlay.classList.add('hidden');
        document.body.classList.remove('overflow-hidden');
      }
    });
  }
  
  // Cart toggle functionality
  if (cartToggle && cartSidebar && closeCart && overlay) {
    cartToggle.addEventListener('click', function() {
      cartSidebar.classList.remove('translate-x-full');
      overlay.classList.remove('hidden');
      document.body.classList.add('overflow-hidden');
      
      // Load cart items
      loadCartItems();
    });
    
    closeCart.addEventListener('click', function() {
      cartSidebar.classList.add('translate-x-full');
      overlay.classList.add('hidden');
      document.body.classList.remove('overflow-hidden');
    });
    
    overlay.addEventListener('click', function() {
      cartSidebar.classList.add('translate-x-full');
      if (mobileMenu) mobileMenu.classList.add('hidden');
      overlay.classList.add('hidden');
      document.body.classList.remove('overflow-hidden');
    });
  }
  
  // Load cart items
  function loadCartItems() {
    const cartItemsContainer = document.getElementById('cart-items');
    const cartTotal = document.getElementById('cart-total');
    
    if (cartItemsContainer && cartTotal) {
      fetch('/cart/items')
        .then(response => response.json())
        .then(data => {
          if (data.items && data.items.length > 0) {
            let html = '';
            let total = 0;
            
            data.items.forEach(item => {
              const itemTotal = item.price * item.quantity;
              total += itemTotal;
              
              html += `
              <div class="flex justify-between items-center py-2 border-b">
                <div>
                  <p class="font-medium">${item.name}</p>
                  <p class="text-sm text-gray-500">${item.quantity} x €${item.price.toFixed(2)}</p>
                </div>
                <div class="flex items-center">
                  <span class="font-medium">€${itemTotal.toFixed(2)}</span>
                  <button class="remove-item ml-2 text-red-500" data-id="${item.id}">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                    </svg>
                  </button>
                </div>
              </div>
              `;
            });
            
            cartItemsContainer.innerHTML = html;
            cartTotal.textContent = `€${total.toFixed(2)}`;
            
            // Add event listeners for remove buttons
            document.querySelectorAll('.remove-item').forEach(button => {
              button.addEventListener('click', function() {
                const itemId = this.dataset.id;
                removeCartItem(itemId);
              });
            });
          } else {
            cartItemsContainer.innerHTML = '<p class="text-gray-500 text-center">Your cart is empty</p>';
            cartTotal.textContent = '€0.00';
          }
        })
        .catch(error => {
          console.error('Error loading cart items:', error);
          cartItemsContainer.innerHTML = '<p class="text-red-500 text-center">Failed to load cart items</p>';
        });
    }
  }
  
  // Remove item from cart
  function removeCartItem(itemId) {
    fetch(`/cart/remove/${itemId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
      }
    })
    .then(response => response.json())
    .then(data => {
      // Reload cart items
      loadCartItems();
      
      // Update cart count
      updateCartCount();
    })
    .catch(error => {
      console.error('Error removing item from cart:', error);
    });
  }
  
  // Add to cart functionality
  const addToCartButtons = document.querySelectorAll('.add-to-cart');
  if (addToCartButtons.length > 0) {
    addToCartButtons.forEach(button => {
      button.addEventListener('click', function(e) {
        e.preventDefault();
        
        const itemId = this.dataset.itemId;
        const restaurantId = this.dataset.restaurantId;
        
        if (!itemId || !restaurantId) {
          console.error('Missing item ID or restaurant ID');
          return;
        }
        
        // Add item to cart
        fetch('/cart/add', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest'
          },
          body: JSON.stringify({
            item_id: itemId,
            restaurant_id: restaurantId,
            quantity: 1
          })
        })
        .then(response => {
          if (!response.ok) {
            throw new Error('Network response was not ok');
          }
          return response.json();
        })
        .then(data => {
          // Update cart count
          updateCartCount();
          
          // Show success message
          alert('Item added to cart!');
        })
        .catch(error => {
          console.error('Error adding item to cart:', error);
          alert('Failed to add item to cart. Please try again.');
        });
      });
    });
  }
}); 