document.addEventListener("DOMContentLoaded", async function () {
    console.log("📥 Fetching menu items...");
    const restaurantId = window.location.pathname.split("/").pop(); // Get restaurant ID from URL
    const menuContainer = document.getElementById("menu-container");

    try {
        const response = await fetch(`/api/restaurant/${restaurantId}/menu`);
        const menuItems = await response.json();

        console.log("✅ Menu Items Received:", menuItems);

        menuContainer.innerHTML = ""; // Clear existing content

        menuItems.forEach(item => {
            const menuItem = document.createElement("div");
            menuItem.className = "bg-white rounded-lg shadow-md p-4";

            menuItem.innerHTML = `
                <img src="${item.image_url}" alt="${item.name}" class="w-24 h-24 object-cover rounded-lg">
                <h3 class="text-lg font-semibold">${item.name}</h3>
                <p class="text-gray-600">${item.description}</p>
                <p class="text-green-600 font-bold">$${item.price}</p>
                <button class="add-to-cart bg-teal-600 text-white px-4 py-2 rounded-lg mt-2" data-id="${item.id}">
                    Add to Cart
                </button>
            `;

            menuContainer.appendChild(menuItem);
        });

    } catch (error) {
        console.error("❌ Error fetching menu:", error);
    }
});
