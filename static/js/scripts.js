document.getElementById('getLocationButton').addEventListener('click', () => {
  const button = document.getElementById('getLocationButton');
  button.disabled = true; // Disable the button during loading
  button.textContent = 'Fetching...';

  if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
          (position) => {
              const latitude = position.coords.latitude;
              const longitude = position.coords.longitude;

              console.log(`Latitude: ${latitude}, Longitude: ${longitude}`);

              // Send to backend for reverse geocoding
              fetch('/reverse-geocode', {
                  method: 'POST',
                  headers: {
                      'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({ latitude, longitude }),
              })
                  .then((response) => response.json())
                  .then((data) => {
                      console.log('Address:', data.address);
                      alert(`Your Address: ${data.address}`);
                      button.textContent = 'Get My Address'; // Reset button text
                      button.disabled = false; // Re-enable the button
                  })
                  .catch((err) => {
                      console.error(err);
                      alert('Error fetching address. Please try again.');
                      button.textContent = 'Get My Address'; // Reset button text
                      button.disabled = false; // Re-enable the button
                  });
          },
          (error) => {
              console.error('Error fetching location:', error);
              alert('Failed to get your location. Please enable location services.');
              button.textContent = 'Get My Address'; // Reset button text
              button.disabled = false; // Re-enable the button
          }
      );
  } else {
      alert('Geolocation is not supported by your browser.');
      button.textContent = 'Get My Address'; // Reset button text
      button.disabled = false; // Re-enable the button
  }
});
