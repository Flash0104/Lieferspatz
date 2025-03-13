document.addEventListener("DOMContentLoaded", function () {
    console.log("✅ JavaScript is loaded!");
    const locationInput = document.getElementById("location-input");
    const suggestionsList = document.getElementById("suggestions");
    const searchButton = document.getElementById("search-btn");
    const restaurantList = document.getElementById("restaurant-list");
    const cartBubble = document.getElementById("cart-bubble");
    const cartBtn = document.getElementById("cart-btn");
    const logoutBtn = document.getElementById("logout-btn");
    const loginBtn = document.getElementById("login-btn");
    const registerBtn = document.getElementById("register-btn");
    const closeCartBtn = document.getElementById("close-cart");
    
    // Sidebar elements
    const sidebarToggle = document.getElementById('sidebar-toggle');
    const closeSidebar = document.getElementById('close-sidebar');
    const navSidebar = document.getElementById('nav-sidebar');
    const navOverlay = document.getElementById('nav-overlay');

    const SUPPORTED_CITIES = ["Duisburg", "Essen", "Düsseldorf"];

    // Initialize sidebar toggle
    if (sidebarToggle && navSidebar && navOverlay) {
        console.log("🔄 Initializing sidebar toggle");
        sidebarToggle.addEventListener('click', function() {
            console.log("🔄 Sidebar toggle clicked");
            navSidebar.style.transform = 'translateX(0)';
            navOverlay.style.display = 'block';
            navOverlay.classList.add('active');
            document.body.classList.add('nav-open');
        });
        
        // Close sidebar with X button
        if (closeSidebar) {
            closeSidebar.addEventListener('click', function() {
                navOverlay.classList.remove('active');
                setTimeout(() => {
                    navSidebar.style.transform = 'translateX(-100%)';
                    navOverlay.style.display = 'none';
                }, 100);
                document.body.classList.remove('nav-open');
            });
        }
        
        // Close sidebar with overlay
        navOverlay.addEventListener('click', function() {
            navOverlay.classList.remove('active');
            setTimeout(() => {
                navSidebar.style.transform = 'translateX(-100%)';
                navOverlay.style.display = 'none';
            }, 100);
            document.body.classList.remove('nav-open');
        });
    }

    // Initialize cart sidebar close button
    if (closeCartBtn) {
        closeCartBtn.addEventListener("click", function() {
            toggleCartPanel();
        });
    }

    // Get city from URL or default to Duisburg
    const urlParams = new URLSearchParams(window.location.search);
    let currentCity = urlParams.get("city") || "Duisburg";
    if (locationInput) {
        locationInput.value = currentCity;
    }

    // Function to fetch restaurants for a city
    async function fetchRestaurants(city) {
        if (!city || !restaurantList) return;
        
        console.log(`🔍 Fetching restaurants for: ${city}`);
        
        try {
            const response = await fetch(`/api/restaurants?city=${encodeURIComponent(city)}`);
            const data = await response.json();
            
            if (data.restaurants && data.restaurants.length > 0) {
                restaurantList.innerHTML = "";
                data.restaurants.forEach((restaurant) => {
                    const restaurantCard = document.createElement("div");
                    restaurantCard.className = "p-4 bg-white shadow-md rounded-2xl hover:shadow-lg transition flex flex-col justify-between h-full";
                    restaurantCard.innerHTML = `
                        <div class="text-center">
                            <h3 class="text-lg font-semibold">${restaurant.name}</h3>
                            <p class="text-gray-600">${restaurant.address}</p>
                        </div>
                        <a href="/restaurant/${restaurant.id}" class="mt-4 px-4 py-2 bg-teal-600 text-white rounded-lg text-center hover:bg-teal-700 transition block">
                            View Menu
                        </a>
                    `;
                    restaurantList.appendChild(restaurantCard);
                });
            } else {
                restaurantList.innerHTML = `<p class="text-center text-gray-500">No restaurants found in ${city}.</p>`;
            }
        } catch (error) {
            console.error("Error fetching restaurants:", error);
            restaurantList.innerHTML = `<p class="text-center text-red-500">Error loading restaurants. Please try again.</p>`;
        }
    }

    // Fetch restaurants for the selected city
    if (restaurantList) {
        fetchRestaurants(currentCity);
    }

    // Debounce function to limit API calls
    function debounce(func, delay) {
        let timeout;
        return function (...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), delay);
        };
    }

    // Fetch location suggestions
    async function fetchLocationSuggestions() {
        if (!locationInput || !suggestionsList) return;
        
        let query = locationInput.value.trim();
        if (query.length < 2) {
            suggestionsList.classList.add("hidden");
            return;
        }

        try {
            const response = await fetch(`/api/places?query=${query}`);
            const data = await response.json();

            if (Array.isArray(data.places) && data.places.length > 0) {
                suggestionsList.innerHTML = "";
                data.places.forEach((place) => {
                    let city = place.address.city || place.address.town || place.address.village;
                    if (!city || !SUPPORTED_CITIES.includes(city)) return;

                    let item = document.createElement("li");
                    item.className = "px-4 py-2 hover:bg-gray-100 cursor-pointer";
                    item.textContent = `${city}`;
                    item.addEventListener("click", () => selectCity(city));
                    suggestionsList.appendChild(item);
                });
                suggestionsList.classList.remove("hidden");
            } else {
                suggestionsList.classList.add("hidden");
            }
        } catch (error) {
            console.error("Error fetching suggestions:", error);
            suggestionsList.classList.add("hidden");
        }
    }

    // If locationInput exists, set up the event listener
    if (locationInput && suggestionsList) {
        locationInput.addEventListener("input", debounce(fetchLocationSuggestions, 300));
    }

    function selectCity(city) {
        if (!locationInput || !suggestionsList) return;
        
        locationInput.value = city;
        suggestionsList.classList.add("hidden");
        updateRestaurants(city);
    }

    // Cart functionality
    async function updateCartCount() {
        console.log("🔄 Global updateCartCount called");
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
                            
                            // Force browser repaint
                            void element.offsetHeight;
                            void element.getBoundingClientRect();
                            
                            // Double check computed style
                            const computed = window.getComputedStyle(element);
                            console.log(`Element ${selector} computed display=${computed.display}, visibility=${computed.visibility}`);
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

    // Update cart count when page loads
    updateCartCount();

    // Add click event to cart button to show cart
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

    // Function to toggle cart panel
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
    
    // Make window.openCart and window.closeCart available globally
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
    
    // Check and update cart every 30 seconds
    setInterval(updateCartCount, 30000);
    
    // Also update cart after each page interaction
    document.addEventListener('click', function() {
        setTimeout(updateCartCount, 1000);
    });
    
    // Create global function for adding to cart
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
    
    // Function to handle location input 
    if (locationInput) {
        // Limit width of location input
        locationInput.style.maxWidth = '200px';
    }

    // Update restaurants when city changes
    async function updateRestaurants(city) {
        if (!city || !restaurantList) return;

        console.log(`🔍 Fetching restaurants for: ${city}`);

        try {
            const response = await fetch(`/api/restaurants?city=${encodeURIComponent(city)}`);
            const data = await response.json();

            if (data.restaurants && data.restaurants.length > 0) {
                restaurantList.innerHTML = "";
                data.restaurants.forEach((restaurant) => {
                    const restaurantCard = document.createElement("div");
                    restaurantCard.className = "p-4 bg-white shadow-md rounded-2xl hover:shadow-lg transition flex flex-col justify-between h-full";
                    restaurantCard.innerHTML = `
                        <div class="text-center">
                            <h3 class="text-lg font-semibold">${restaurant.name}</h3>
                            <p class="text-gray-600">${restaurant.address}</p>
                        </div>
                        <a href="/restaurant/${restaurant.id}" class="mt-4 px-4 py-2 bg-teal-600 text-white rounded-lg text-center hover:bg-teal-700 transition block">
                            View Menu
                        </a>
                    `;
                    restaurantList.appendChild(restaurantCard);
                });

                // Update URL with the selected city
                const newUrl = new URL(window.location);
                newUrl.searchParams.set("city", city);
                window.history.pushState({}, "", newUrl);
            } else {
                restaurantList.innerHTML = `<p class="text-center text-gray-500">No restaurants found in ${city}.</p>`;
            }
        } catch (error) {
            console.error("Error fetching restaurants:", error);
            restaurantList.innerHTML = `<p class="text-center text-red-500">Error loading restaurants. Please try again.</p>`;
        }
    }

    // Function to check authentication status and update UI
    function checkAuthAndUpdateUI() {
        console.log("✅ Checking authentication status...");

        // Add a random query parameter to force a fresh request
        const timestamp = new Date().getTime();
        const random = Math.random().toString(36).substring(2, 15);
        
        // Use the new dedicated endpoint for auth checking
        fetch(`/check-auth-status?t=${timestamp}&r=${random}`, { 
            method: "GET", 
            credentials: "include",
            cache: "no-store", // Prevent caching of the response
            headers: {
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0'
            }
        })
        .then(response => {
            console.log("Auth check response status:", response.status);
            return response.json();
        })
        .then(data => {
            console.log("🔄 Auth Status:", data);

            if (!data.logged_in) {
                console.log("✅ User is logged out, updating UI...");

                // Hide Logout & Welcome Text - more aggressive approach
                if (logoutBtn) {
                    console.log("Hiding logout button");
                    if (logoutBtn.parentElement && logoutBtn.parentElement.tagName === 'FORM') {
                        logoutBtn.parentElement.style.display = "none";
                    } else {
                        logoutBtn.style.display = "none";
                    }
                }
                
                // Hide ALL welcome text elements across the entire site
                const welcomeElements = document.querySelectorAll("#welcome-text, span#welcome-text, .welcome-text");
                console.log("Found welcome elements:", welcomeElements.length);
                welcomeElements.forEach(el => {
                    console.log("Hiding welcome element:", el);
                    el.style.display = "none";
                });
                
                // Also hide any elements containing the text "Welcome"
                document.querySelectorAll("*").forEach(el => {
                    if (el.innerText && el.innerText.includes("Welcome,") && 
                        !el.querySelector("input, button, a") && 
                        el.tagName !== "BODY" && el.tagName !== "HTML") {
                        console.log("Hiding element with Welcome text:", el);
                        el.style.display = "none";
                    }
                });

                // Add a style tag to force hide welcome elements with !important
                const style = document.createElement('style');
                style.textContent = `
                    #welcome-text, .welcome-text, span#welcome-text, 
                    [id="welcome-text"], span[id="welcome-text"], 
                    *[id^="welcome"] {
                        display: none !important;
                        visibility: hidden !important;
                        opacity: 0 !important;
                    }
                `;
                document.head.appendChild(style);

                // Show Login & Register
                if (loginBtn) {
                    console.log("Showing login button");
                    loginBtn.style.display = "inline-block";
                }
                if (registerBtn) {
                    console.log("Showing register button");
                    registerBtn.style.display = "inline-block";
                }
            } else {
                console.log("🔒 User is logged in!");
            }
        })
        .catch(error => console.error("❌ Error checking auth:", error));
    }

    // Check authentication status immediately when page loads
    document.addEventListener('DOMContentLoaded', function() {
        console.log("🔄 Page loaded - checking auth status");
        
        // Clean up URL if it has cache-busting parameters
        if (window.location.search.includes('nocache=') || window.location.search.includes('r=')) {
            // Get the base URL without cache parameters
            const url = new URL(window.location.href);
            
            // Remove cache-busting parameters but keep other parameters
            const params = new URLSearchParams(url.search);
            params.delete('nocache');
            params.delete('r');
            
            // Only keep the city parameter if it exists
            const city = params.get('city');
            const cleanParams = city ? `?city=${city}` : '';
            
            // Replace the current URL without reloading the page
            const cleanUrl = `${window.location.origin}${window.location.pathname}${cleanParams}`;
            window.history.replaceState({}, document.title, cleanUrl);
        }
        
        // Immediately check for welcome message and hide it if needed
        function hideWelcomeIfLoggedOut() {
            // Function to get cookie value
            function getCookie(name) {
                const value = `; ${document.cookie}`;
                const parts = value.split(`; ${name}=`);
                if (parts.length === 2) return parts.pop().split(';').shift();
                return null;
            }
            
            // Check if we have the logged_out cookie
            if (getCookie('logged_out') === '1') {
                console.log("🔥 Detected logout cookie - forcing hard reload");
                
                // Clear the cookie
                document.cookie = "logged_out=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
                
                // Hide all welcome elements immediately
                document.querySelectorAll('#welcome-text, .welcome-message, .welcome-name, span#welcome-text, .welcome-text').forEach(el => {
                    console.log("Hiding welcome element on page load:", el);
                    el.style.display = 'none';
                    el.style.visibility = 'hidden';
                    el.style.opacity = '0';
                });
                
                // Add a style tag to force hide welcome elements with !important
                const style = document.createElement('style');
                style.textContent = `
                    #welcome-text, .welcome-text, span#welcome-text, 
                    [id="welcome-text"], span[id="welcome-text"], 
                    *[id^="welcome"], *[class*="welcome"],
                    .welcome-message, .welcome-name {
                        display: none !important;
                        visibility: hidden !important;
                        opacity: 0 !important;
                        position: absolute !important;
                        left: -9999px !important;
                        pointer-events: none !important;
                    }
                `;
                document.head.appendChild(style);
                
                // Force a direct DOM update to the header
                const headerWelcomeText = document.querySelector('header span#welcome-text');
                if (headerWelcomeText) {
                    console.log("Directly removing header welcome text on page load");
                    headerWelcomeText.remove();
                }
                
                // Show login/register buttons
                if (loginBtn) loginBtn.style.display = 'inline-block';
                if (registerBtn) registerBtn.style.display = 'inline-block';
                
                // Hide logout button
                if (logoutBtn) {
                    if (logoutBtn.parentElement && logoutBtn.parentElement.tagName === 'FORM') {
                        logoutBtn.parentElement.style.display = 'none';
                    } else {
                        logoutBtn.style.display = 'none';
                    }
                }
                
                // Force a complete page reload with cache busting
                // Use replaceState to hide the cache parameters
                const timestamp = new Date().getTime();
                const random = Math.random().toString(36).substring(2, 15);
                const reloadUrl = `/?nocache=${timestamp}&r=${random}`;
                
                setTimeout(() => {
                    // Load the page with cache busting parameters
                    window.location.href = reloadUrl;
                }, 100);
            }
        }
        
        // Run immediately
        hideWelcomeIfLoggedOut();
        
        // Then check auth status
        checkAuthAndUpdateUI();
    });

    // Also check authentication status when the page becomes visible again
    document.addEventListener('visibilitychange', function() {
        if (document.visibilityState === 'visible') {
            checkAuthAndUpdateUI();
        }
    });

    // Logout form event listener
    if (document.querySelector('form[action="/logout"]')) {
        document.querySelector('form[action="/logout"]').addEventListener('submit', function(e) {
            e.preventDefault();
            
            console.log("🔥 Logout initiated - aggressively handling logout");
            
            // IMMEDIATELY hide all welcome messages - more aggressive approach
            document.querySelectorAll('#welcome-text, span#welcome-text, .welcome-text, [id*="welcome"], [class*="welcome"]').forEach(el => {
                console.log("Hiding welcome element:", el);
                el.style.display = 'none';
                el.style.visibility = 'hidden';
                el.style.opacity = '0';
            });
            
            // Hide ANY element containing "Welcome" text - more aggressive
            document.querySelectorAll('*').forEach(el => {
                if (el.textContent && 
                    (el.textContent.includes('Welcome') || el.textContent.includes('welcome')) && 
                    !el.querySelector('button, a, input, select, textarea')) {
                    console.log("Hiding element with Welcome text:", el);
                    el.style.display = 'none';
                    el.style.visibility = 'hidden';
                    el.style.opacity = '0';
                }
            });
            
            // Hide logout button, show login/register
            if (logoutBtn) {
                console.log("Hiding logout button");
                if (logoutBtn.parentElement && logoutBtn.parentElement.tagName === 'FORM') {
                    logoutBtn.parentElement.style.display = 'none';
                } else {
                    logoutBtn.style.display = 'none';
                }
            }
            
            if (loginBtn) {
                console.log("Showing login button");
                loginBtn.style.display = 'inline-block';
            }
            
            if (registerBtn) {
                console.log("Showing register button");
                registerBtn.style.display = 'inline-block';
            }
            
            // Add a style tag to force hide welcome elements with !important
            const style = document.createElement('style');
            style.textContent = `
                #welcome-text, .welcome-text, span#welcome-text, 
                [id="welcome-text"], span[id="welcome-text"], 
                *[id^="welcome"], *[class*="welcome"],
                span:contains("Welcome"), div:contains("Welcome") {
                    display: none !important;
                    visibility: hidden !important;
                    opacity: 0 !important;
                    position: absolute !important;
                    left: -9999px !important;
                    pointer-events: none !important;
                }
            `;
            document.head.appendChild(style);
            
            // Force a direct DOM update to the header
            const headerWelcomeText = document.querySelector('header span#welcome-text');
            if (headerWelcomeText) {
                console.log("Directly removing header welcome text");
                headerWelcomeText.remove();
            }
            
            // Send the logout request
            fetch('/logout', {
                method: 'POST',
                headers: {
                    'Cache-Control': 'no-cache, no-store, must-revalidate',
                    'Pragma': 'no-cache',
                    'Expires': '0'
                },
                credentials: 'same-origin'
            })
            .then(response => {
                console.log("Logout response received:", response.status);
                
                // Clear any auth-related cookies manually
                document.cookie = "session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
                
                // Force a complete page reload with aggressive cache busting
                const timestamp = new Date().getTime();
                const random = Math.random().toString(36).substring(2, 15);
                
                // Create URL with cache busting parameters
                const reloadUrl = `/?nocache=${timestamp}&r=${random}`;
                
                // Navigate to the URL with cache busting
                window.location.href = reloadUrl;
            })
            .catch(error => {
                console.error('Logout error:', error);
                // Force reload even if there was an error
                window.location.reload(true);
            });
        });
    }

    // Search button click event
    if (searchButton && locationInput) {
        searchButton.addEventListener("click", function () {
            const city = locationInput.value.trim();
            if (city) updateRestaurants(city);
        });
    }

    // Listen for Enter key to trigger search
    if (locationInput) {
        locationInput.addEventListener("keypress", function (event) {
            if (event.key === "Enter") {
                event.preventDefault();
                const city = locationInput.value.trim();
                if (city) updateRestaurants(city);
            }
        });
    }

    // Hide suggestions when clicking outside
    if (locationInput && suggestionsList) {
        document.addEventListener("click", (e) => {
            if (!locationInput.contains(e.target) && !suggestionsList.contains(e.target)) {
                suggestionsList.classList.add("hidden");
            }
        });
    }

    // Update cart count when items are added or removed
    document.addEventListener("click", async function (event) {
        if (event.target.classList.contains("add-to-cart") || event.target.classList.contains("remove-item")) {
            await updateCartCount();
        }
    });

    // Set up event listeners when DOM is loaded
    console.log("📣 Initializing close handlers");
    
    // Add event listener to cart button
    const cartButtons = document.querySelectorAll('.cart-button');
    cartButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            toggleCartPanel();
        });
    });
    
    // Add event listener to close button
    const closeBtn = document.getElementById('close-cart');
    if (closeBtn) {
        closeBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log("Close button handler attached: close-cart");
            closeCart();
        });
    }
    
    // Add event listener to cart overlay
    const cartOverlay = document.getElementById('cart-overlay');
    if (cartOverlay) {
        cartOverlay.addEventListener('click', function(e) {
            e.preventDefault();
            console.log("Overlay click handler attached");
            closeCart();
        });
    }
    
    // Add event listener for ESC key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            console.log("ESC key handler attached");
            closeCart();
        }
    });
    
    // Initialize cart count
    updateCartCount();

    // Initialize the cart functionality
    initializeCart();

    // Fix header styling issues
    function fixHeaderStyling() {
        console.log("Applying header styling fix");
        const header = document.querySelector('header');
        
        if (header) {
            // Force override all problematic background properties with inline styles
            header.style.cssText = `
                background: linear-gradient(to right, #0d9488, #0f766e) !important;
                background-image: none !important;
                background-blend-mode: normal !important;
                backdrop-filter: none !important;
                -webkit-backdrop-filter: none !important;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1) !important;
                z-index: 1000 !important;
                visibility: visible !important;
                position: fixed !important;
                width: 100% !important;
                top: 0 !important;
            `;
            
            // Find and fix all child elements that need visibility
            const headerContainer = header.querySelector('.container');
            if (headerContainer) {
                headerContainer.style.cssText = `
                    display: flex !important;
                    align-items: center !important;
                    justify-content: space-between !important;
                    padding: 0.75rem 1rem !important;
                    position: relative !important;
                    z-index: 1001 !important;
                    visibility: visible !important;
                `;
            }
            
            // Fix logo and buttons
            const logo = header.querySelector('img[src*="Lieferspatz"]');
            if (logo) {
                logo.style.cssText = `
                    max-height: 40px !important;
                    visibility: visible !important;
                    z-index: 1002 !important;
                `;
            }
            
            // Fix cart button
            const cartBtn = header.querySelector('#cart-btn');
            if (cartBtn) {
                cartBtn.style.cssText = `
                    visibility: visible !important;
                    z-index: 1002 !important;
                    position: relative !important;
                    display: flex !important;
                `;
            }
            
            console.log("Header styling fix applied");
        } else {
            console.error("Header element not found");
        }
    }

    // Apply header fix on page load and after any potential layout changes
    document.addEventListener('DOMContentLoaded', function() {
        console.log("DOMContentLoaded event fired");
        
        // Apply immediately
        fixHeaderStyling();
        
        // And apply again after a short delay to catch any late DOM modifications
        setTimeout(fixHeaderStyling, 100);
        setTimeout(fixHeaderStyling, 500);
        
        // Add listeners for potential layout changes
        window.addEventListener('resize', fixHeaderStyling);
        window.addEventListener('scroll', fixHeaderStyling, { passive: true });
        
        // Apply fix after any script might have modified the header
        const navToggles = document.querySelectorAll('#sidebar-toggle, #cart-btn');
        navToggles.forEach(toggle => {
            toggle.addEventListener('click', function() {
                setTimeout(fixHeaderStyling, 10);
            });
        });
    });
});

// Add a function to load cart items
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

// Add a function to remove item from cart
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

// Initialize the cart functionality
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
