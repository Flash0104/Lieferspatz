document.addEventListener("DOMContentLoaded", function () {
    console.log("✅ JavaScript is loaded!");
    const locationInput = document.getElementById("location-input");
    const suggestionsList = document.getElementById("suggestions");
    const searchButton = document.getElementById("search-btn");
    const restaurantList = document.getElementById("restaurant-list");
    const cartBubble = document.getElementById("cart-bubble");

    const SUPPORTED_CITIES = ["Duisburg", "Essen", "Düsseldorf"];

    // Get city from URL or default to Duisburg
    const urlParams = new URLSearchParams(window.location.search);
    let currentCity = urlParams.get("city") || "Duisburg";
    locationInput.value = currentCity;

    // Fetch restaurants for the selected city
    fetchRestaurants(currentCity);


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
                    item.textContent = city;
                    item.classList.add("cursor-pointer", "p-2", "hover:bg-gray-200");
                    item.addEventListener("click", () => selectCity(city));
                    suggestionsList.appendChild(item);
                });

                suggestionsList.classList.remove("hidden");
            } else {
                suggestionsList.classList.add("hidden");
            }
        } catch (error) {
            console.error("❌ Error fetching location data:", error);
            suggestionsList.classList.add("hidden");
        }
    }

    locationInput.addEventListener("input", debounce(fetchLocationSuggestions, 300));

    // Select city and update restaurants
    function selectCity(city) {
        locationInput.value = city;
        suggestionsList.classList.add("hidden");
        updateRestaurants(city);
    }

    // Fetch and update restaurant list dynamically
    async function fetchRestaurants(city) {
        try {
            const response = await fetch(`/api/restaurants?city=${encodeURIComponent(city)}`);
            const data = await response.json();
            console.log(`📊 Restaurants in ${city}:`, data);

            restaurantList.innerHTML = ""; // Clear existing content

            if (data.restaurants.length === 0) {
                restaurantList.innerHTML = `<p class="text-gray-600 text-center">No restaurants found in ${city}.</p>`;
                return;
            }

            data.restaurants.forEach((restaurant) => {
                const card = document.createElement("div");
                card.className = "bg-white rounded-lg shadow-lg p-4 flex flex-col items-center text-center min-h-[220px]";

                card.innerHTML = `
                <div class="w-24 h-24 aspect-square">
                    <img src="${restaurant.image_url || '/static/images/default.png'}" alt="${restaurant.name}" class="w-full h-full object-cover rounded-full">
                </div>
                <h3 class="text-lg font-semibold mt-3">${restaurant.name}</h3>
                <p class="text-gray-600">${restaurant.address}</p>
                <a href="/menu?restaurant=${encodeURIComponent(restaurant.name)}"
                class="mt-3 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition">
                View Menu
                </a>
            `;


                restaurantList.appendChild(card);
            });
        } catch (error) {
            console.error("❌ Error fetching restaurant data:", error);
            restaurantList.innerHTML = `<p class="text-red-500">Error loading restaurants.</p>`;
        }
    }


    async function updateCart() {
        console.log("🔄 Fetching cart data...");
        
        try {
            const response = await fetch("/cart", { method: "GET", credentials: "include" });
    
            // 🚨 Detect if the response is an HTML page (meaning it redirected)
            const contentType = response.headers.get("content-type");
            if (contentType && contentType.includes("text/html")) {
                console.warn("🚨 Redirect detected! User is not logged in.");
                window.location.href = "/login"; // Redirect user to login page
                return;
            }
    
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
    
            const data = await response.json(); // ✅ Now safe to parse JSON
            console.log("✅ Cart data received:", data);
    
            cartItems.innerHTML = "";
    
            if (!data.items || data.items.length === 0) {
                cartItems.innerHTML = '<p class="text-gray-500 text-center mt-10">Your cart is empty.</p>';
                cartTotal.innerHTML = "$0.00";
            } else {
                let totalFee = 0;
                data.items.forEach(item => {
                    totalFee += item.price * item.quantity;
                    const cartItem = document.createElement("div");
                    cartItem.classList.add("flex", "justify-between", "items-center", "border-b", "pb-4", "mt-4");
    
                    cartItem.innerHTML = `
                        <div>
                            <h3 class="font-semibold">${item.name}</h3>
                            <p class="text-gray-500">${item.quantity} x $${item.price.toFixed(2)}</p>
                        </div>
                        <button class="remove-item text-red-500 font-bold text-lg" data-id="${item.id}">&times;</button>
                    `;
    
                    cartItems.appendChild(cartItem);
                });
    
                cartTotal.innerHTML = `<span>Total Fee: $${totalFee.toFixed(2)}</span>`;
            }
        } catch (error) {
            console.error("❌ Error fetching cart:", error);
        }
    }
    
    
    document.addEventListener("click", async function (event) {
        if (event.target.classList.contains("remove-item")) {
            const itemId = event.target.getAttribute("data-id");
    
            console.log(`🗑 Trying to remove item with ID: ${itemId}`); // Debug log
    
            if (!itemId) {
                console.error("❌ No item ID found!");
                return;
            }
    
            try {
                const response = await fetch(`/cart/remove/${itemId}`, { method: "POST" });
    
                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }
    
                console.log("✅ Item removed successfully.");
                await updateCart();  // Update UI
            } catch (error) {
                console.error("❌ Error removing item:", error);
            }
        }
    });
       
    
    

// Fetch cart count on page load
function updateCartCount() {
    fetch("/cart/count")
        .then(response => response.json())
        .then(data => {
            if (data.count > 0) {
                cartBubble.textContent = data.count;
                cartBubble.classList.remove("hidden");
            } else {
                cartBubble.classList.add("hidden");
            }
        })
        .catch(error => console.error("Error fetching cart count:", error));
}

updateCartCount(); // Initial Load

// 🔥 Event Delegation to Handle Dynamically Added Items
document.addEventListener("click", function (event) {
    if (event.target.classList.contains("add-to-cart")) {
        event.preventDefault();

        const itemId = event.target.dataset.itemId;
        console.log(`🛒 Adding item ${itemId} to cart...`);

        fetch(`/cart/add/${itemId}`, { method: "POST" })
            .then(response => response.json())
            .then(data => {
                console.log("✅ Item added to cart:", data);
                updateCart(); // Update the cart UI
            })
            .catch(error => console.error("❌ Error adding item:", error));
    }
});

// Update restaurants when city changes
async function updateRestaurants(city) {
    if (!city) return;

    console.log(`🔍 Fetching restaurants for: ${city}`);

    try {
        const response = await fetch(`/api/restaurants?city=${encodeURIComponent(city)}`);

        if (!response.ok) throw new Error("Failed to fetch restaurants.");

        const data = await response.json();
        console.log("📊 Received Restaurants:", data);

        // Ensure data.restaurants is an array
        const restaurantArray = data.restaurants;
        if (!Array.isArray(restaurantArray)) {
            console.error("❌ Error: Expected an array but got", restaurantArray);
            return;
        }

        // Clear the existing restaurant list
        const restaurantList = document.getElementById("restaurant-list");
        restaurantList.innerHTML = "";

        // Populate with new data
        restaurantArray.forEach(restaurant => {
            const card = document.createElement("div");
            card.className = "bg-white rounded-lg shadow-lg p-4 flex flex-col items-center text-center min-h-[220px]";
            
            card.innerHTML = `
                <div class="w-24 h-24 aspect-square">
                    <img src="${restaurant.image_url || '/static/images/default.png'}" alt="${restaurant.name}" class="w-full h-full object-cover rounded-full">
                </div>
                <h3 class="text-lg font-semibold mt-3">${restaurant.name}</h3>
                <p class="text-gray-600">${restaurant.address}</p>
                <a href="/menu?restaurant=${encodeURIComponent(restaurant.name)}" class="mt-3 px-4 py-2 bg-teal-600 text-white rounded-lg">View Menu</a>
            `;

            restaurantList.appendChild(card);
        });

    } catch (error) {
        console.error("❌ Error updating restaurants:", error);
    }
}


document.addEventListener("DOMContentLoaded", function () {
    console.log("✅ DOM fully loaded, attaching Logout button event...");

    const logoutBtn = document.getElementById("logout-btn");
    const loginBtn = document.getElementById("login-btn");
    const registerBtn = document.getElementById("register-btn");
    const welcomeText = document.getElementById("welcome-text");

    if (!logoutBtn) {
        console.error("❌ Logout button not found!");
        return;
    }

    logoutBtn.addEventListener("click", async function () {
        try {
            const response = await fetch("/logout", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                }
            });

            if (response.ok) {
                // Hide Logout & Welcome Text
                logoutBtn.style.display = "none";
                welcomeText.style.display = "none";

                // Show Login & Register
                loginBtn.style.display = "inline-block";
                registerBtn.style.display = "inline-block";
            } else {
                console.error("❌ Logout failed!");
            }
        } catch (error) {
            console.error("❌ Error during logout:", error);
        }
    });
});


document.getElementById("logout-btn").addEventListener("click", function() {
    console.log("Logout button clicked!");
});




  



function updateUIAfterLogout() {
    fetch("/check-auth", { method: "GET", credentials: "include" })
        .then(response => response.json())
        .then(data => {
            console.log("🔄 Checking authentication status:", data);

            const logoutBtn = document.getElementById("logout-btn");
            const loginBtn = document.getElementById("login-btn");
            const registerBtn = document.getElementById("register-btn");
            const welcomeText = document.getElementById("welcome-text");

            if (!data.logged_in) {
                console.log("✅ User is logged out, updating UI...");

                // Hide Logout & Welcome Text
                if (logoutBtn) logoutBtn.style.display = "none";
                if (welcomeText) welcomeText.style.display = "none";

                // Show Login & Register
                if (loginBtn) loginBtn.style.display = "inline-block";
                if (registerBtn) registerBtn.style.display = "inline-block";
            } else {
                console.warn("🚨 User is still logged in. Something is wrong!");
            }
        })
        .catch(error => console.error("❌ Error checking auth:", error));
}

// Make function globally available
window.updateUIAfterLogout = updateUIAfterLogout;




document.addEventListener("DOMContentLoaded", async function () {
    console.log("✅ Document fully loaded!");

    // Get cart-related elements
    const cartSidebar = document.getElementById("cart-sidebar");
    const cartOverlay = document.getElementById("cart-overlay");
    const cartItems = document.getElementById("cart-items");
    const cartTotal = document.getElementById("cart-total");
    const cartBtn = document.getElementById("cart-btn");
    const closeCartBtn = document.getElementById("close-cart");

    // Ensure essential elements exist
    if (!cartSidebar || !cartOverlay || !cartItems || !cartTotal || !cartBtn || !closeCartBtn) {
        console.error("❌ Some cart elements are missing! Check HTML.");
        return;
    }

    console.log("🛒 All cart elements found!");

    document.addEventListener("DOMContentLoaded", function () {
        console.log("✅ Document fully loaded!");
    
        document.body.addEventListener("click", function (event) {
            console.log("🖱 Click detected:", event.target);
    
            // ✅ Cart Button Click
            if (event.target.closest("#cart-btn")) {
                console.log("🛒 Cart button clicked!");
                toggleCart();
            }
    
            // ✅ Close Cart Button Click
            if (event.target.closest("#close-cart")) {
                console.log("❌ Close button clicked!");
                toggleCart();
            }
    
            // ✅ Click on Cart Overlay to Close
            if (event.target.closest("#cart-overlay")) {
                console.log("❌ Cart overlay clicked! Closing...");
                toggleCart();
            }
        });
    
        // ✅ Function to toggle cart sidebar
        function toggleCart() {
            console.log("🔄 Toggling cart...");
            const cartSidebar = document.getElementById("cart-sidebar");
            const cartOverlay = document.getElementById("cart-overlay");
    
            if (!cartSidebar || !cartOverlay) {
                console.error("❌ Cart elements are missing! Check HTML.");
                return;
            }
    
            cartSidebar.classList.toggle("translate-x-full");
            cartOverlay.classList.toggle("opacity-50");
            cartOverlay.classList.toggle("pointer-events-none");
        }
    });
    

    // ✅ Attach event listeners directly
    cartBtn.addEventListener("click", function () {
        console.log("🛒 Cart button clicked!");
        toggleCart();
    });

    closeCartBtn.addEventListener("click", function () {
        console.log("❌ Close button clicked!");
        toggleCart();
    });

    cartOverlay.addEventListener("click", function () {
        console.log("❌ Cart overlay clicked! Closing...");
        toggleCart();
    });

    console.log("✅ Cart event listeners attached!");

    // ✅ Fetch Cart Data
    async function updateCart() {
        console.log("🔄 Fetching cart data...");

        try {
            const response = await fetch("/cart");
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            const data = await response.json();
            console.log("✅ Cart data received:", data);

            cartItems.innerHTML = "";

            if (!data.items || data.items.length === 0) {
                cartItems.innerHTML = '<p class="text-gray-500 text-center mt-10">Your cart is empty.</p>';
                cartTotal.innerHTML = "$0.00";
            } else {
                let originalFee = 0;
                data.items.forEach(item => {
                    originalFee += item.price * item.quantity;

                    if (!item.id && !item.item_id) {
                        console.error("❌ Item ID is missing! Skipping this item:", item);
                        return;
                    }

                    const itemId = item.id || item.item_id;

                    const cartItem = document.createElement("div");
                    cartItem.classList.add("flex", "justify-between", "items-center", "border-b", "pb-4", "mt-4");

                    cartItem.innerHTML = `
                        <div>
                            <h3 class="font-semibold">${item.name}</h3>
                            <p class="text-gray-500">${item.quantity} x $${item.price.toFixed(2)}</p>
                        </div>
                        <button class="remove-item text-red-500 font-bold text-lg" data-id="${itemId}">&times;</button>
                    `;

                    cartItems.appendChild(cartItem);
                });

                let serviceFee = originalFee * 0.15;
                let totalFee = originalFee + serviceFee;

                cartTotal.innerHTML = `
                    <div class="text-lg font-semibold flex justify-between">
                        <span>Original Fee (85%):</span> <span>$${originalFee.toFixed(2)}</span>
                    </div>
                    <div class="text-lg font-semibold flex justify-between text-gray-600">
                        <span>Service Fee (15%):</span> <span>$${serviceFee.toFixed(2)}</span>
                    </div>
                    <div class="text-xl font-bold flex justify-between mt-2">
                        <span>Total Fee:</span> <span>$${totalFee.toFixed(2)}</span>
                    </div>
                `;
            }
        } catch (error) {
            console.error("❌ Error fetching cart:", error);
        }
    }

    await updateCart(); // Ensure cart is loaded before event listeners

    // ✅ Handle Remove Item Clicks
    document.addEventListener("click", async function (event) {
        if (event.target.classList.contains("remove-item")) {
            const itemId = event.target.getAttribute("data-id");

            console.log(`🗑 Trying to remove item with ID: ${itemId}`);

            if (!itemId || itemId === "undefined") {
                console.error("❌ No valid item ID found!");
                return;
            }

            try {
                const response = await fetch(`/cart/remove/${itemId}`, { method: "POST" });

                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }

                console.log("✅ Item removed successfully.");
                await updateCart(); // Update UI
            } catch (error) {
                console.error("❌ Error removing item:", error);
            }
        }
    });

    console.log("✅ Script fully initialized!");
});







document.addEventListener("DOMContentLoaded", function () {
    console.log("✅ Document fully loaded!");

    const cartSidebar = document.getElementById("cart-sidebar");
    const cartOverlay = document.getElementById("cart-overlay");
    const cartBtn = document.getElementById("cart-btn");
    const closeCart = document.getElementById("close-cart");
    const cartItems = document.getElementById("cart-items");
    const cartTotal = document.getElementById("cart-total");

    if (!cartSidebar || !cartOverlay || !cartBtn || !closeCart || !cartItems || !cartTotal) {
        console.warn("⚠️ Some cart elements are missing. Disabling cart functions.");
        return; // Prevent further execution
    }

    console.log("🛒 All cart elements found!");

    // ✅ Function to toggle cart sidebar
    function toggleCart() {
        console.log("🔄 Toggling cart...");
        const cartSidebar = document.getElementById("cart-sidebar");
        const cartOverlay = document.getElementById("cart-overlay");

        if (!cartSidebar || !cartOverlay) {
            console.error("❌ Cart elements are missing! Check HTML.");
            return;
        }

        cartSidebar.classList.toggle("translate-x-full");
        cartOverlay.classList.toggle("opacity-50");
        cartOverlay.classList.toggle("pointer-events-none");
    }
});




    // Search button click event
    searchButton.addEventListener("click", function () {
        const city = locationInput.value.trim();
        if (city) updateRestaurants(city);
    });

    // Listen for Enter key to trigger search
    locationInput.addEventListener("keypress", function (event) {
        if (event.key === "Enter") {
            event.preventDefault();
            const city = locationInput.value.trim();
            if (city) updateRestaurants(city);
        }
    });

    // Hide suggestions when clicking outside
    document.addEventListener("click", (e) => {
        if (!locationInput.contains(e.target) && !suggestionsList.contains(e.target)) {
            suggestionsList.classList.add("hidden");
        }
    });
});

});

document.addEventListener("DOMContentLoaded", function () {
    console.log("✅ Attaching Logout Event Listener...");
    
    const logoutBtn = document.getElementById("logout-btn");
    const loginBtn = document.getElementById("login-btn");
    const registerBtn = document.getElementById("register-btn");
    const welcomeText = document.getElementById("welcome-text");

    if (!logoutBtn) {
        console.error("❌ Logout button not found!");
        return;
    }

    logoutBtn.addEventListener("click", async function () {
        console.log("🚀 Logout button clicked!");

        try {
            const response = await fetch("/logout", {
                method: "POST",
                credentials: "include",
            });

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            console.log("✅ Logout Successful!");

            // 🔥 Remove session storage & cookies
            localStorage.clear();
            sessionStorage.clear();
            document.cookie.split(";").forEach(cookie => {
                document.cookie = cookie.replace(/^ +/, "").replace(/=.*/, "=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/");
            });

            // 🔄 Update UI after logout
            if (logoutBtn) logoutBtn.style.display = "none";
            if (welcomeText) welcomeText.style.display = "none";
            if (loginBtn) loginBtn.style.display = "inline-block";
            if (registerBtn) registerBtn.style.display = "inline-block";

        } catch (error) {
            console.error("❌ Logout Failed:", error);
        }
    });
});


document.addEventListener("DOMContentLoaded", function () {
    console.log("✅ Checking authentication status...");

    fetch("/check-auth", { method: "GET", credentials: "include" })
        .then(response => response.json())
        .then(data => {
            console.log("🔄 Auth Status:", data);

            const logoutBtn = document.getElementById("logout-btn");
            const loginBtn = document.getElementById("login-btn");
            const registerBtn = document.getElementById("register-btn");
            const welcomeText = document.getElementById("welcome-text");

            if (!data.logged_in) {
                console.log("✅ User is logged out, updating UI...");

                // Hide Logout & Welcome Text
                if (logoutBtn) logoutBtn.style.display = "none";
                if (welcomeText) welcomeText.style.display = "none";

                // Show Login & Register
                if (loginBtn) loginBtn.style.display = "inline-block";
                if (registerBtn) registerBtn.style.display = "inline-block";
            } else {
                console.log("🔒 User is logged in!");
            }
        })
        .catch(error => console.error("❌ Error checking auth:", error));
});

document.addEventListener("DOMContentLoaded", function () {
    const cartBubble = document.getElementById("cart-bubble");

    async function updateCartCount() {
        try {
            const response = await fetch("/cart/count");
            const data = await response.json();
            const count = data.count;

            if (count > 0) {
                cartBubble.textContent = count;
                cartBubble.classList.remove("hidden");
            } else {
                cartBubble.classList.add("hidden");
            }
        } catch (error) {
            console.error("❌ Error fetching cart count:", error);
        }
    }

    updateCartCount();

    // Update cart count when items are added or removed
    document.addEventListener("click", async function (event) {
        if (event.target.classList.contains("add-to-cart") || event.target.classList.contains("remove-item")) {
            await updateCartCount();
        }
    });
});
