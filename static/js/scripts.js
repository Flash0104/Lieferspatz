document.addEventListener("DOMContentLoaded", function () {
    const locationInput = document.getElementById("location-input");
    const suggestionsList = document.getElementById("suggestions");
    const googleButton = document.querySelector(".google-register");

    // Debounce function to reduce API calls
    function debounce(func, delay) {
        let timeout;
        return function (...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), delay);
        };
    }

    // Fetch suggestions based on input
    async function fetchLocationSuggestions() {
        let query = locationInput.value.trim();
        if (query.length < 2) return;

        try {
            const response = await fetch(`/api/places?query=${query}`, {
                headers: {
                    "User-Agent": "Lieferspatz/1.0 (+https://lieferspatz.com)" // Ensuring OSM allows the request
                }
            });

            if (!response.ok) throw new Error("Failed to fetch locations.");

            const data = await response.json();

            if (Array.isArray(data.places)) {
                suggestionsList.innerHTML = "";
                data.places.forEach((place) => {
                    let item = document.createElement("li");
                    item.textContent = place.name;
                    item.classList.add("cursor-pointer", "p-2", "hover:bg-gray-200");
                    item.addEventListener("click", () => selectLocation(place));
                    suggestionsList.appendChild(item);
                });
                suggestionsList.classList.remove("hidden");
            }
        } catch (error) {
            console.error("Error fetching location data:", error);
        }
    }

    locationInput.addEventListener("input", debounce(fetchLocationSuggestions, 300));

    // Select location and update the map
    function selectLocation(place) {
        locationInput.value = place.name;
        suggestionsList.classList.add("hidden");

        // Check if lat/lon are valid numbers
        const lat = parseFloat(place.lat);
        const lon = parseFloat(place.lon);
        if (!isNaN(lat) && !isNaN(lon) && typeof map !== "undefined") {
            map.setView([lat, lon], 14);
            L.marker([lat, lon]).addTo(map).bindPopup(place.name).openPopup();
        } else {
            console.error("Invalid location coordinates:", place);
        }
    }

    // Close dropdown when clicking outside
    document.addEventListener("click", (e) => {
        if (!locationInput.contains(e.target) && !suggestionsList.contains(e.target)) {
            suggestionsList.classList.add("hidden");
        }
    });

    // Google login button handler
    if (googleButton) {
        googleButton.addEventListener("click", function () {
            window.location.href = "/login/google";  // Redirects to Google OAuth login
        });
    }
});
