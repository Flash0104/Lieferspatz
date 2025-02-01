document.addEventListener("DOMContentLoaded", function () {
    const locationInput = document.getElementById("location-input");
    const suggestionsList = document.getElementById("suggestions");
    const searchButton = document.getElementById("search-btn");
    const restaurantList = document.getElementById("restaurant-list");

    const SUPPORTED_CITIES = ["Duisburg", "Essen", "Düsseldorf", "Köln", "Bonn", "Hamburg", "München", "Berlin"];

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
                `;

                restaurantList.appendChild(card);
            });
        } catch (error) {
            console.error("❌ Error fetching restaurant data:", error);
            restaurantList.innerHTML = `<p class="text-red-500">Error loading restaurants.</p>`;
        }
    }

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
