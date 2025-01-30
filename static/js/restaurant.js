document.addEventListener("DOMContentLoaded", async function () {
    const restaurantList = document.getElementById("restaurant-list");

    async function fetchRestaurants() {
        try {
            // Ensure the correct file path
            response = await fetch("./static/js/restaurant.json");

            console.log(response)

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            const restaurants = await response.json();
            restaurantList.innerHTML = "";

            restaurants.forEach(restaurant => {
                const card = document.createElement("div");
                card.className = "bg-white rounded-lg shadow-lg p-4 flex flex-col items-center text-center min-h-[220px]";

                card.innerHTML = `
                    <div class="w-24 h-24 aspect-square">
                        <img src="${restaurant.image}" alt="${restaurant.name}" class="w-full h-full object-cover rounded-full">
                    </div>
                    <h3 class="text-lg font-semibold mt-3">${restaurant.name}</h3>
                    <p class="text-gray-600">${restaurant.rating} ⭐ (${restaurant.reviews}+) • ${restaurant.delivery_time}</p>
                `;

                restaurantList.appendChild(card);
            });

        } catch (error) {
            console.error("Error loading restaurants:", error);
            restaurantList.innerHTML = "<p class='text-red-500'>Failed to load restaurant data.</p>";
        }
    }

    fetchRestaurants();
});
