/**
 * Lieferspatz - Optimized JavaScript
 * This file combines essential functionality from multiple JS files
 * with performance optimizations.
 */

// Main Lieferspatz App
window.Lieferspatz = window.Lieferspatz || {};

(function() {
  'use strict';
  
  // Core configuration
  const config = {
    selectors: {
      header: 'header',
      sidebar: '#nav-sidebar',
      sidebarToggle: '#sidebar-toggle',
      sidebarClose: '#close-sidebar',
      sidebarOverlay: '#nav-overlay',
      cart: '#cart-sidebar',
      cartToggle: '#cart-btn',
      cartClose: '#close-cart',
      cartOverlay: '#cart-overlay',
      cartItems: '#cart-items',
      cartCount: '#cart-count',
      locationInput: '#location-input',
      restaurantList: '#restaurant-list'
    },
    classes: {
      navOpen: 'nav-open',
      cartOpen: 'cart-open',
      active: 'active'
    },
    endpoints: {
      cart: '/api/cart',
      cartCount: '/cart/count',
      removeItem: '/cart/remove/',
      addItem: '/cart/add/',
      restaurants: '/api/restaurants',
      locations: '/api/places'
    },
    timing: {
      headerFixDelay: 100,
      debounceDelay: 300
    }
  };
  
  // DOM selectors utility functions
  const $ = selector => document.querySelector(selector);
  const $$ = selector => document.querySelectorAll(selector);
  
  // Debounce function to limit how often a function is called
  const debounce = (func, delay) => {
    let timeout;
    return function(...args) {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), delay);
    };
  };
  
  // Store initialized state
  let initialized = false;
  
  /**
   * Header and UI fixes
   */
  const UI = {
    // Apply emergency header styling fix
    fixHeader: function() {
      const header = $(config.selectors.header);
      if (!header) return;
      
      // Set critical CSS properties directly
      Object.assign(header.style, {
        background: 'linear-gradient(to right, #0d9488, #0f766e)',
        position: 'fixed',
        top: '0',
        left: '0',
        right: '0',
        zIndex: '50',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        display: 'block',
        visibility: 'visible'
      });
      
      // Create a style element to ensure header is properly styled
      const style = document.createElement('style');
      style.textContent = `
        header {
          background: linear-gradient(to right, #0d9488, #0f766e) !important;
          position: fixed !important;
          top: 0 !important;
          left: 0 !important;
          right: 0 !important;
          z-index: 50 !important;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06) !important;
          display: block !important;
          visibility: visible !important;
        }
        
        header::before, header::after {
          display: none !important;
        }
        
        body {
          padding-top: 60px !important;
        }
      `;
      document.head.appendChild(style);
      
      console.log("Applied emergency header fix");
    },
    
    // Remove any unwanted images or styles
    cleanupRogueElements: function() {
      // Hide any large images that might be logos
      $$('img').forEach(function(img) {
        const src = img.getAttribute('src') || '';
        if ((src.includes('Lieferspatz.png') || 
            (src.includes('logo') && !src.includes('favicon.png'))) &&
            (img.width > 100 || img.height > 100)) {
          img.style.display = 'none';
        }
      });
      
      // Remove background images with logo
      $$('*').forEach(function(el) {
        const style = window.getComputedStyle(el);
        const bg = style.backgroundImage;
        if (bg && (bg.includes('logo') || bg.includes('Lieferspatz') || bg.includes('orange'))) {
          el.style.backgroundImage = 'none';
        }
      });
      
      // Force body background
      document.body.style.backgroundColor = '#f3f4f6';
    },
    
    // Initialize UI observers
    setupObservers: function() {
      // Monitor for dynamically added elements
      const observer = new MutationObserver(mutations => {
        mutations.forEach(mutation => {
          if (mutation.addedNodes.length) {
            this.cleanupRogueElements();
          }
        });
      });
      
      // Start observing
      observer.observe(document.body, { childList: true, subtree: true });
      
      // Watch for changes to the header
      const headerObserver = new MutationObserver(() => {
        this.fixHeader();
      });
      
      const header = $(config.selectors.header);
      if (header) {
        headerObserver.observe(header, { 
          attributes: true, 
          attributeFilter: ['style', 'class'] 
        });
      }
    }
  };
  
  /**
   * Navigation sidebar functionality
   */
  const Sidebar = {
    init: function() {
      const sidebarToggle = $(config.selectors.sidebarToggle);
      const sidebarClose = $(config.selectors.sidebarClose);
      const sidebarOverlay = $(config.selectors.sidebarOverlay);
      
      if (sidebarToggle) {
        sidebarToggle.addEventListener('click', this.open.bind(this));
      }
      
      if (sidebarClose) {
        sidebarClose.addEventListener('click', this.close.bind(this));
      }
      
      if (sidebarOverlay) {
        sidebarOverlay.addEventListener('click', this.close.bind(this));
      }
      
      // Close sidebar on escape key
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          this.close();
        }
      });
    },
    
    open: function() {
      document.body.classList.add(config.classes.navOpen);
      const overlay = $(config.selectors.sidebarOverlay);
      if (overlay) {
        overlay.classList.add(config.classes.active);
      }
    },
    
    close: function() {
      document.body.classList.remove(config.classes.navOpen);
      const overlay = $(config.selectors.sidebarOverlay);
      if (overlay) {
        overlay.classList.remove(config.classes.active);
      }
    }
  };
  
  /**
   * Cart functionality
   */
  const Cart = {
    items: [],
    isLoading: false,
    
    init: function() {
      const cartToggle = $(config.selectors.cartToggle);
      const cartClose = $(config.selectors.cartClose);
      const cartOverlay = $(config.selectors.cartOverlay);
      
      if (cartToggle) {
        cartToggle.addEventListener('click', this.toggle.bind(this));
      }
      
      if (cartClose) {
        cartClose.addEventListener('click', this.close.bind(this));
      }
      
      if (cartOverlay) {
        cartOverlay.addEventListener('click', this.close.bind(this));
      }
      
      // Load cart and update cart count on page load
      this.updateCount();
      
      // Only load cart items when needed
      window.addEventListener('load', () => {
        // Lazy load cart items after page load for better performance
        setTimeout(() => this.loadItems(), 500);
      });
    },
    
    toggle: function() {
      if (document.body.classList.contains(config.classes.cartOpen)) {
        this.close();
      } else {
        this.open();
      }
    },
    
    open: function() {
      // Load cart items if not already loaded
      if (this.items.length === 0 && !this.isLoading) {
        this.loadItems();
      }
      
      document.body.classList.add(config.classes.cartOpen);
      const sidebar = $(config.selectors.cart);
      const overlay = $(config.selectors.cartOverlay);
      
      if (sidebar) {
        sidebar.classList.add(config.classes.active);
      }
      
      if (overlay) {
        overlay.classList.add(config.classes.active);
      }
    },
    
    close: function() {
      document.body.classList.remove(config.classes.cartOpen);
      const sidebar = $(config.selectors.cart);
      const overlay = $(config.selectors.cartOverlay);
      
      if (sidebar) {
        sidebar.classList.remove(config.classes.active);
      }
      
      if (overlay) {
        overlay.classList.remove(config.classes.active);
      }
    },
    
    updateCount: function() {
      fetch(config.endpoints.cartCount)
        .then(response => {
          if (response.ok) return response.json();
          throw new Error('Failed to get cart count');
        })
        .then(data => {
          const cartCount = $(config.selectors.cartCount);
          
          if (cartCount) {
            cartCount.textContent = data.count;
            
            // Show/hide the count bubble based on count
            if (data.count > 0) {
              cartCount.style.display = 'flex';
            } else {
              cartCount.style.display = 'none';
            }
          }
        })
        .catch(error => {
          console.error('Error updating cart count:', error);
        });
    },
    
    loadItems: function() {
      if (this.isLoading) return;
      
      this.isLoading = true;
      const cartItemsContainer = $(config.selectors.cartItems);
      
      if (!cartItemsContainer) {
        this.isLoading = false;
        return;
      }
      
      // Set loading state
      cartItemsContainer.innerHTML = '<div class="text-center py-4"><div class="inline-block animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-teal-500"></div><p class="mt-2 text-gray-600">Loading cart...</p></div>';
      
      fetch(config.endpoints.cart)
        .then(response => {
          if (!response.ok) throw new Error('Failed to load cart');
          return response.json();
        })
        .then(data => {
          this.items = data.items || [];
          
          // Render cart items
          this.renderItems(cartItemsContainer);
        })
        .catch(error => {
          console.error('Error loading cart items:', error);
          cartItemsContainer.innerHTML = '<div class="text-center py-4"><p class="text-red-500">Failed to load cart items</p></div>';
        })
        .finally(() => {
          this.isLoading = false;
        });
    },
    
    renderItems: function(container) {
      if (!container) return;
      
      if (this.items.length === 0) {
        container.innerHTML = '<div class="text-center py-8"><p class="text-gray-500">Your cart is empty</p><p class="mt-2 text-sm text-gray-400">Add items from restaurants to get started</p></div>';
        return;
      }
      
      let html = '';
      let total = 0;
      
      // Group items by restaurant
      const groupedItems = {};
      this.items.forEach(item => {
        if (!groupedItems[item.restaurant_id]) {
          groupedItems[item.restaurant_id] = {
            restaurant_name: item.restaurant_name,
            items: []
          };
        }
        groupedItems[item.restaurant_id].items.push(item);
        total += item.price * item.quantity;
      });
      
      // Generate HTML for each restaurant's items
      Object.values(groupedItems).forEach(group => {
        html += `
          <div class="mb-4 pb-4 border-b border-gray-200">
            <h3 class="font-medium text-gray-800 mb-2">${group.restaurant_name}</h3>
            <div class="space-y-3">
        `;
        
        group.items.forEach(item => {
          const itemTotal = (item.price * item.quantity).toFixed(2);
          html += `
            <div class="flex justify-between items-center" data-item-id="${item.id}">
              <div class="flex-1">
                <h4 class="font-medium">${item.name}</h4>
                <div class="flex items-center mt-1">
                  <div class="flex items-center mr-4">
                    <button class="px-2 bg-gray-200 rounded-l" onclick="Lieferspatz.Cart.updateQuantity(${item.id}, ${item.quantity - 1})">-</button>
                    <span class="px-2">${item.quantity}</span>
                    <button class="px-2 bg-gray-200 rounded-r" onclick="Lieferspatz.Cart.updateQuantity(${item.id}, ${item.quantity + 1})">+</button>
                  </div>
                  <p class="text-teal-700 font-medium">${itemTotal} €</p>
                </div>
              </div>
              <button class="text-red-500 hover:text-red-700" onclick="Lieferspatz.Cart.removeItem(${item.id})">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          `;
        });
        
        html += `
            </div>
          </div>
        `;
      });
      
      // Add checkout section
      html += `
        <div class="mt-4 pt-2 border-t border-gray-200">
          <div class="flex justify-between items-center mb-4">
            <span class="font-semibold">Total:</span>
            <span class="font-semibold text-teal-700">${total.toFixed(2)} €</span>
          </div>
          <a href="/checkout" class="block w-full bg-teal-600 text-white text-center py-2 rounded-md hover:bg-teal-700 transition-colors">
            Proceed to Checkout
          </a>
        </div>
      `;
      
      container.innerHTML = html;
    },
    
    removeItem: function(itemId) {
      fetch(`${config.endpoints.removeItem}${itemId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        }
      })
        .then(response => {
          if (response.ok) {
            // Update cart UI
            this.items = this.items.filter(item => item.id !== itemId);
            this.renderItems($(config.selectors.cartItems));
            this.updateCount();
            
            // If cart is empty after removing an item, delay closing to avoid jarring UX
            if (this.items.length === 0) {
              setTimeout(() => this.close(), 1500);
            }
          } else {
            console.error('Failed to remove item from cart');
          }
        })
        .catch(error => {
          console.error('Error removing item from cart:', error);
        });
    },
    
    updateQuantity: function(itemId, newQuantity) {
      if (newQuantity < 1) return;
      
      const item = this.items.find(item => item.id === itemId);
      if (!item) return;
      
      // Optimistically update UI
      item.quantity = newQuantity;
      this.renderItems($(config.selectors.cartItems));
      
      // Send request to update item quantity
      fetch(`${config.endpoints.addItem}${itemId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        },
        body: JSON.stringify({ quantity: newQuantity })
      })
        .then(response => {
          if (response.ok) {
            // Update cart count
            this.updateCount();
          } else {
            // Revert UI if request failed
            console.error('Failed to update item quantity');
            this.loadItems(); // Reload cart data
          }
        })
        .catch(error => {
          console.error('Error updating item quantity:', error);
          this.loadItems(); // Reload cart data on error
        });
    }
  };
  
  /**
   * Location search functionality
   */
  const Location = {
    init: function() {
      const locationInput = $(config.selectors.locationInput);
      
      if (locationInput) {
        // Set up autocomplete with debounce
        locationInput.addEventListener('input', debounce(this.searchLocations.bind(this), config.timing.debounceDelay));
        
        // Close suggestions on click outside
        document.addEventListener('click', (e) => {
          if (!locationInput.contains(e.target)) {
            this.closeSuggestions();
          }
        });
      }
    },
    
    searchLocations: function(event) {
      const query = event.target.value.trim();
      const suggestionsContainer = document.getElementById('location-suggestions');
      
      if (!suggestionsContainer) return;
      
      if (query.length < 2) {
        suggestionsContainer.innerHTML = '';
        suggestionsContainer.style.display = 'none';
        return;
      }
      
      // Show loading state
      suggestionsContainer.innerHTML = '<div class="p-2 text-center text-gray-500">Searching...</div>';
      suggestionsContainer.style.display = 'block';
      
      fetch(`${config.endpoints.locations}?q=${encodeURIComponent(query)}`)
        .then(response => {
          if (!response.ok) throw new Error('Search failed');
          return response.json();
        })
        .then(data => {
          this.renderSuggestions(data.places, suggestionsContainer);
        })
        .catch(error => {
          console.error('Error searching locations:', error);
          suggestionsContainer.innerHTML = '<div class="p-2 text-center text-red-500">Error searching. Please try again.</div>';
        });
    },
    
    renderSuggestions: function(places, container) {
      if (!places || places.length === 0) {
        container.innerHTML = '<div class="p-2 text-center text-gray-500">No locations found</div>';
        return;
      }
      
      let html = '';
      places.forEach(place => {
        html += `
          <div class="p-2 hover:bg-gray-100 cursor-pointer" onclick="Lieferspatz.Location.selectPlace('${place.address}')">
            <div class="font-medium">${place.address}</div>
            <div class="text-sm text-gray-600">${place.city}</div>
          </div>
        `;
      });
      
      container.innerHTML = html;
    },
    
    selectPlace: function(address) {
      const locationInput = $(config.selectors.locationInput);
      if (locationInput) {
        locationInput.value = address;
        
        // If on home page, redirect to restaurants
        if (window.location.pathname === '/') {
          window.location.href = '/restaurants';
        } else {
          // Otherwise, refresh restaurant list if applicable
          this.updateRestaurants(address);
        }
      }
      
      this.closeSuggestions();
    },
    
    closeSuggestions: function() {
      const suggestionsContainer = document.getElementById('location-suggestions');
      if (suggestionsContainer) {
        suggestionsContainer.style.display = 'none';
      }
    },
    
    updateRestaurants: function(location) {
      const restaurantList = $(config.selectors.restaurantList);
      if (!restaurantList) return;
      
      // Show loading state
      restaurantList.innerHTML = '<div class="col-span-full text-center py-12"><div class="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-teal-500"></div><p class="mt-4 text-gray-600">Loading restaurants...</p></div>';
      
      // Fetch restaurants for the location
      fetch(`${config.endpoints.restaurants}?location=${encodeURIComponent(location)}`)
        .then(response => response.json())
        .then(data => {
          if (data.restaurants && data.restaurants.length > 0) {
            this.renderRestaurants(data.restaurants, restaurantList);
          } else {
            restaurantList.innerHTML = '<div class="col-span-full text-center py-12"><p class="text-xl text-gray-600">No restaurants found in this area</p><p class="mt-2 text-gray-500">Try searching for a different location</p></div>';
          }
        })
        .catch(error => {
          console.error('Error loading restaurants:', error);
          restaurantList.innerHTML = '<div class="col-span-full text-center py-12"><p class="text-red-500">Failed to load restaurants</p><p class="mt-2 text-gray-600">Please try again later</p></div>';
        });
    },
    
    renderRestaurants: function(restaurants, container) {
      let html = '';
      
      restaurants.forEach(restaurant => {
        const isOpen = restaurant.is_open ? '' : `
          <div class="restaurant-closed-overlay">
            <div class="closed-indicator">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              Momentan nicht verfügbar
            </div>
          </div>
        `;
        
        html += `
          <a href="/restaurant/${restaurant.id}" class="restaurant-card">
            ${isOpen}
            <div class="bg-white rounded-lg shadow-md overflow-hidden transition-all hover:shadow-lg">
              <div class="restaurant-photo-container">
                <img src="${restaurant.image_url || '/static/images/default_restaurant.jpg'}" alt="${restaurant.name}" class="restaurant-photo">
              </div>
              <div class="p-4">
                <h3 class="text-lg font-semibold text-gray-800">${restaurant.name}</h3>
                <div class="flex items-center mt-1">
                  <div class="bg-teal-50 text-teal-700 px-2 py-1 rounded-full flex items-center text-sm">
                    <svg class="w-4 h-4 mr-1 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    ${restaurant.rating.toFixed(1)}
                  </div>
                  <span class="text-sm text-gray-500 ml-2">(${restaurant.rating_count} ratings)</span>
                </div>
                <div class="mt-2 text-sm text-gray-600">${restaurant.address}</div>
                <div class="flex justify-between items-center mt-3">
                  <span class="text-sm text-gray-600">Delivery: ${restaurant.delivery_time} min</span>
                  <span class="text-sm text-gray-600">Min: ${restaurant.min_order} €</span>
                </div>
              </div>
            </div>
          </a>
        `;
      });
      
      container.innerHTML = html;
    }
  };
  
  /**
   * Restaurant page functionality
   */
  const Restaurant = {
    // This can be lazily initialized only on restaurant pages
    init: function() {
      // Check if we're on a restaurant page
      if (!window.location.pathname.includes('/restaurant/')) return;
      
      // Set up event delegation for add to cart buttons
      document.addEventListener('click', (e) => {
        const addButton = e.target.closest('.add-to-cart-btn');
        if (addButton) {
          e.preventDefault();
          
          const itemId = addButton.dataset.itemId;
          const quantityInput = document.querySelector(`#quantity-${itemId}`);
          const quantity = quantityInput ? parseInt(quantityInput.value) : 1;
          
          if (itemId && quantity > 0) {
            this.addToCart(itemId, quantity);
          }
        }
      });
    },
    
    addToCart: function(itemId, quantity) {
      fetch(`${config.endpoints.addItem}${itemId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        },
        body: JSON.stringify({ quantity })
      })
        .then(response => {
          if (response.ok) {
            Cart.updateCount();
            
            // Show a success notification
            this.showNotification('Item added to cart!', 'success');
            
            // Open cart after a short delay
            setTimeout(() => Cart.open(), 500);
          } else {
            this.showNotification('Failed to add item to cart', 'error');
          }
        })
        .catch(error => {
          console.error('Error adding item to cart:', error);
          this.showNotification('Error adding item to cart', 'error');
        });
    },
    
    showNotification: function(message, type = 'success') {
      // Create notification element
      const notification = document.createElement('div');
      notification.className = `fixed top-16 right-4 p-3 rounded-lg shadow-lg ${type === 'success' ? 'bg-teal-600 text-white' : 'bg-red-600 text-white'}`;
      notification.style.zIndex = '9999';
      notification.style.maxWidth = '300px';
      notification.style.transition = 'opacity 0.3s, transform 0.3s';
      notification.style.opacity = '0';
      notification.style.transform = 'translateY(-20px)';
      notification.textContent = message;
      
      // Add to DOM
      document.body.appendChild(notification);
      
      // Trigger animation
      setTimeout(() => {
        notification.style.opacity = '1';
        notification.style.transform = 'translateY(0)';
      }, 10);
      
      // Remove after delay
      setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateY(-20px)';
        
        setTimeout(() => {
          document.body.removeChild(notification);
        }, 300);
      }, 3000);
    }
  };
  
  /**
   * Initialize Lieferspatz application
   */
  function init() {
    if (initialized) return;
    
    // Apply header fix immediately
    UI.fixHeader();
    
    // Initialize components after DOM content is loaded
    document.addEventListener('DOMContentLoaded', () => {
      // Core UI functionality
      UI.cleanupRogueElements();
      UI.setupObservers();
      
      // Navigation, Cart and Location components
      Sidebar.init();
      Cart.init();
      Location.init();
      
      // Lazily initialize Restaurant functionality
      setTimeout(() => Restaurant.init(), 100);
      
      // Cleanup again after a delay to catch any dynamic elements
      setTimeout(() => UI.cleanupRogueElements(), 500);
    });
    
    // Apply fixes again after window load
    window.addEventListener('load', () => {
      UI.fixHeader();
      UI.cleanupRogueElements();
    });
    
    initialized = true;
  }
  
  // Export API to global Lieferspatz object
  window.Lieferspatz = {
    init,
    UI,
    Cart,
    Sidebar,
    Location,
    Restaurant
  };
  
  // Auto-initialize when script is loaded
  init();
})(); 