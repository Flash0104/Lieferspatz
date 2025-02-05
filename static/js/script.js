<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="Lieferspatz - Find your favorite restaurants and order delicious food in just a few clicks.">
    <link rel="icon" href="/static/favicon.ico" type="image/x-icon">
    <link rel="stylesheet" href="/static/css/tailwind.css">

    <title>Lieferspatz - Home</title>

    <!-- Load OpenStreetMap Leaflet Library -->
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>

<script>
document.addEventListener("DOMContentLoaded", function () {
    const locationInput = document.getElementById('location-input');
    const suggestionsList = document.getElementById('suggestions');

    if (!suggestionsList) {
        console.error("❌ suggestionsList element not found!");
        return;
    }

    locationInput.addEventListener('input', function () {
        const query = this.value.trim();
        if (query.length > 2) {
            fetch(`/api/places?query=${encodeURIComponent(query)}`)
                .then(response => response.json())
                .then(data => {
                    console.log("✅ API Response:", data);
                    suggestionsList.innerHTML = '';
                    if (data.places && data.places.length > 0) {
                        data.places.forEach(place => {
                            const li = document.createElement('li');
                            li.textContent = place.name;
                            li.classList.add('px-4', 'py-2', 'hover:bg-gray-100', 'cursor-pointer');
                            li.addEventListener('click', () => {
                                locationInput.value = place.name;
                                suggestionsList.classList.add('hidden');
                            });
                            suggestionsList.appendChild(li);
                        });
                        suggestionsList.classList.remove('hidden');
                    } else {
                        suggestionsList.classList.add('hidden');
                    }
                })
                .catch(error => console.error('❌ Error fetching places:', error));
        } else {
            suggestionsList.classList.add('hidden');
        }
    });

    document.addEventListener('click', function (event) {
        if (!locationInput.contains(event.target) && !suggestionsList.contains(event.target)) {
            suggestionsList.classList.add('hidden');
        }
    });
});

    </script>
</head>

<body class="bg-gray-200 font-sans flex flex-col min-h-screen">

    <!-- Load Custom JavaScript -->
    <script src="{{ url_for('static', filename='js/script.js') }}"></script>
</body>
</html>




<!-- Header -->
<header class="fixed top-0 left-0 w-full bg-gradient-to-r from-teal-400 to-teal-600 shadow-md z-50">
  <div class="container mx-auto flex items-center justify-between px-6">
    <!-- Left Section -->
    <div class="flex items-center space-x-6">
      <!-- Menu Icon -->
      <button class="focus:outline-none" aria-label="Open Menu">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" class="cursor-pointer">
          <title>Menu</title>
          <path
            fill-rule="evenodd"
            clip-rule="evenodd"
            d="M23 4H1v3h22V4Zm0 7H1v3h22v-3ZM1 18h22v3H1v-3Z"
            fill="currentColor">
          </path>
        </svg>
      </button>

      <!-- Logo -->
      <a href="/" aria-label="Lieferspatz Home" class="flex items-center">
        <img src="/static/favicon.png" alt="Lieferspatz Logo" class="w-10 h-10" />
        <span class="text-xl font-bold ml-4">Lieferspatz</span>
      </a>
    </div>

    <!-- Center Section - Location Input (Pushed Slightly Right) -->
    <div class="relative flex-1 flex justify-center ml-auto">
      <div class="flex items-center bg-white rounded-full px-5 py-2 shadow space-x-4 w-full max-w-lg">
        <!-- Location Icon -->
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" class="text-gray-500">
          <path
            fill-rule="evenodd"
            clip-rule="evenodd"
            d="M12 1c2.4 0 4.9.9 6.7 2.8 3.7 3.7 3.7 9.8 0 13.4L12 24l-6.7-6.7c-3.7-3.7-3.7-9.8 0-13.5C7.1 1.9 9.6 1 12 1Zm0 18.8 4.6-4.6c2.5-2.6 2.5-6.7 0-9.3C15.4 4.7 13.7 4 12 4c-1.7 0-3.4.7-4.6 1.9-2.5 2.6-2.5 6.7 0 9.3l4.6 4.6Zm2-9.3a2 2 0 1 1-4 0 2 2 0 0 1 4 0Z"
            fill="currentColor"></path>
        </svg>

        <!-- Location Input -->
<div class="relative flex-1 flex justify-center">
  <div class="relative w-full max-w-lg">
      <input id="location-input" type="text" placeholder="Enter Your Location"
          class="w-full px-4 py-2 text-gray-700 bg-white border rounded-full shadow-sm">
      <ul id="suggestions"
          class="absolute top-full left-0 w-full bg-white border border-gray-200 rounded-lg shadow-lg hidden max-h-60 overflow-y-auto">
      </ul>
  </div>
  <button id="search-btn" class="px-4 py-2 bg-teal-600 text-white rounded-full ml-2">Search</button>
</div>


      </div>
    </div>
    


    <div class="flex items-center space-x-4">
        {% if current_user.is_authenticated %}
            <span id="welcome-text" class="text-white font-semibold">
                Welcome, <span class="capitalize">{{ current_user.first_name }}</span>!
            </span>
            <button id="logout-btn" class="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600">
                Logout
            </button>                     
          
        {% else %}
            <a href="/login" id="login-btn"
                class="px-5 py-2 bg-blue-500 text-white font-medium rounded-lg hover:bg-blue-600 transition-all shadow-md">
                Login
            </a>
            <a href="/register" id="register-btn"
                class="px-5 py-2 bg-green-500 text-white font-medium rounded-lg hover:bg-green-600 transition-all shadow-md">
                Register
            </a>
        {% endif %}
    </div>
    




<!-- Cart Button with Bubble -->
        <div class="relative">
          <button id="cart-btn" class="focus:outline-none">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
                  <path fill-rule="evenodd" clip-rule="evenodd"
                      d="M5.5 18H21l2-12.5H6.5l-.5-3H.9v3h2.5L5.5 18Zm14-9.5-1 6.5H8L7 8.5h12.5ZM7.5 23a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm14-2a2 2 0 1 1-4 0 2 2 0 0 1 4 0Z"
                      fill="currentColor"></path>
              </svg>
          </button>

          <!-- Bubble for Cart Count -->
          <div id="cart-bubble" class="absolute top-0 right-0 bg-green-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center hidden">
              0
          </div>
<!-- Background Overlay (Gray & Semi-Transparent) -->
<div id="cart-overlay" class="fixed inset-0 bg-black bg-opacity-50 opacity-0 pointer-events-none transition-opacity duration-300 z-40"></div>

<!-- Cart Sidebar -->
<div id="cart-sidebar" class="fixed top-0 right-[-420px] w-[420px] h-full bg-white shadow-2xl transition-all duration-300 flex flex-col">
    <div class="p-6 flex justify-between items-center border-b">
      <h2 class="text-xl font-bold">Your Cart</h2>
      <button id="close-cart" class="text-gray-600 text-3xl cursor-pointer">&times;</button>
  </div>

  <!-- Cart Items Container -->
  <div id="cart-items" class="p-6 space-y-4 flex-1 overflow-y-auto">
      <p class="text-gray-500 text-center">Your cart is empty.</p>
  </div>

  <!-- Price Summary & Checkout Button -->
  <div class="p-6 bg-white border-t">
      <div class="flex justify-between text-lg font-semibold">
          <span>Total Fee:</span> 
          <span id="cart-total">$0.00</span>
      </div>

      <button id="checkout-btn" class="w-full bg-teal-600 text-white py-3 rounded-lg hover:bg-teal-700 transition mt-4">
          Checkout
      </button>
  </div>
</div>


<script>
    document.addEventListener("DOMContentLoaded", function () {
        console.log("✅ Document fully loaded!");
    
        // Get elements
        const cartSidebar = document.getElementById("cart-sidebar");
        const cartOverlay = document.getElementById("cart-overlay");
        const cartBtn = document.getElementById("cart-btn");
        const closeCart = document.getElementById("close-cart");
        const cartItems = document.getElementById("cart-items");
        const cartTotal = document.getElementById("cart-total");
    
        if (!cartSidebar || !cartOverlay || !cartBtn || !closeCart || !cartItems || !cartTotal) {
            console.error("❌ One or more cart elements are missing! Check your HTML structure.");
            return;
        }
    
        console.log("🛒 All cart elements found!");
    
        function toggleCart() {
            console.log("🛒 Toggling cart...");
            cartSidebar.classList.toggle("open");
            cartOverlay.classList.toggle("visible");
        }
    
        cartBtn.addEventListener("click", toggleCart);
        closeCart.addEventListener("click", toggleCart);
        cartOverlay.addEventListener("click", toggleCart);
    
        console.log("✅ Cart button event listeners attached!");
    
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
                    let totalFee = data.items.reduce((acc, item) => acc + item.price * item.quantity, 0);
                    cartTotal.innerHTML = `<span>Total Fee: $${totalFee.toFixed(2)}</span>`;
                }
            } catch (error) {
                console.error("❌ Error fetching cart:", error);
            }
        }
    
        updateCart();
    
        document.addEventListener("click", async function (event) {
            if (event.target.classList.contains("remove-item")) {
                const itemId = event.target.getAttribute("data-id");
                console.log(`🗑 Removing item with ID: ${itemId}`);
                await fetch(`/cart/remove/${itemId}`, { method: "POST" });
                updateCart();
            }
        });
    });
    </script>
    
  
  

          
        </div>
    </div>
  </div>
</header>



<!-- Hero Section -->
<section class="bg-gray-200 mt-16 pt-32 pb-12">
  <div class="bg-white rounded-lg shadow-lg p-8 mx-auto max-w-6xl flex flex-col md:flex-row items-center gap-8">
    <!-- Left Content Section -->
    <div class="flex-1 space-y-6 text-center md:text-left">
      <h1 class="text-4xl font-extrabold text-gray-900 leading-tight">
        Hungry? <span class="text-teal-600">Order now!</span>
      </h1>
      <p class="text-gray-700 text-lg">
        Satisfy your cravings with just a few clicks. Browse, order, and enjoy the best food delivered to your doorstep.
      </p>
      <div class="flex flex-wrap gap-4 justify-center md:justify-start">
        <button id="getLocationButton" class="px-6 py-3 bg-teal-600 text-white text-lg font-medium rounded-lg shadow hover:bg-teal-700 focus:ring-4 focus:ring-teal-300 focus:outline-none transition-all">
          Get My Address
        </button>
        <a href="/login" class="px-6 py-3 bg-gray-200 text-gray-800 text-lg font-medium rounded-lg shadow hover:bg-gray-300 focus:ring-4 focus:ring-gray-200 focus:outline-none transition-all">
          Login
        </a>
        <a href="/register" class="px-6 py-3 bg-teal-600 text-white text-lg font-medium rounded-lg shadow hover:bg-teal-700 focus:ring-4 focus:ring-teal-300 focus:outline-none transition-all">
          Register
        </a>
      </div>
    </div>
    <!-- Right Graphic Section -->
    <div class="flex-1 flex justify-center items-center">
      <div class="bg-gray-200 rounded-lg w-64 h-64 flex items-center justify-center shadow-inner">
        <img src="/static/images/hero_image.png" alt="Delicious meal" class="w-full h-full object-contain rounded-lg" />
      </div>
    </div>

  </div>
</section>
  


<section class="max-w-6xl mx-auto py-12">
  <h2 class="text-2xl font-bold text-gray-900 mb-8 text-center">Popular Restaurants</h2>
  
  <div id="restaurant-list" class="grid grid-cols-4 gap-6">
    {% for restaurant in restaurants %}
    <div class="p-4 bg-white shadow-md rounded-2xl hover:shadow-lg transition flex flex-col justify-between h-full">
        <div class="text-center">
            <h3 class="text-lg font-semibold">{{ restaurant.name }}</h3>
            <p class="text-gray-600">{{ restaurant.address }}</p>
        </div>
        <!-- 🆕 "View Menu" Button -->
        <a href="{{ url_for('restaurant_menu', restaurant_id=restaurant.id) }}"
           class="mt-4 px-4 py-2 bg-teal-600 text-white rounded-lg text-center hover:bg-teal-700 transition block">
            View Menu
        </a>
    </div>
    {% endfor %}
</div>


</section>




    



<footer class="bg-gray-800 text-white py-8 mt-auto">
  <div class="container mx-auto flex flex-col md:flex-row justify-between items-center space-y-6 md:space-y-0">
      
      <!-- Payment Methods -->
      <div class="flex items-center space-x-4">
          <img src="/static/images/visa.svg" alt="Visa" class="w-12">
          <img src="/static/images/mastercard.svg" alt="MasterCard" class="w-12">
          <img src="/static/images/maestro.svg" alt="Maestro" class="w-12">
          <img src="/static/images/amex.svg" alt="American Express" class="w-12">
          <img src="/static/images/paypal.svg" alt="PayPal" class="w-12">
      </div>

      <!-- Subscription Form -->
      <div class="flex items-center space-x-3">
          <input
              type="email"
              placeholder="Enter your email"
              class="w-72 p-3 rounded-lg border border-gray-400 text-gray-800 focus:outline-none focus:border-teal-400"
          />
          <button class="bg-teal-500 text-white px-6 py-3 rounded-lg hover:bg-teal-600">
              Subscribe
          </button>
      </div>
  </div>
</footer>



<script src="{{ url_for('static', filename='js/script.js') }}"></script>

</body>
</html>