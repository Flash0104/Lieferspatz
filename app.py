from flask import Flask, render_template
from dotenv import load_dotenv
import os

# Load environment variables from the .env file
load_dotenv()

# Get the Google Maps API key from the environment variables
google_maps_api_key = os.getenv("GOOGLE_MAPS_API_KEY")


app = Flask(__name__)

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/api/places', methods=['GET'])
def get_places():
    query = request.args.get('query')
    if not query:
        return jsonify({"error": "Query parameter is missing"}), 400

    url = f"https://maps.googleapis.com/maps/api/place/autocomplete/json"
    params = {
        "input": query,
        "key": GOOGLE_MAPS_API_KEY,
        "types": "geocode",  # Only return geocoding results
        "language": "de",   # Change to "de" for German results
    }

    response = requests.get(url, params=params)
    if response.status_code == 200:
        return jsonify(response.json())
    else:
        return jsonify({"error": "Failed to fetch places"}), response.status_code

@app.route('/reverse-geocode', methods=['POST'])
def reverse_geocode():
    try:
        data = request.get_json()
        latitude = data.get('latitude')
        longitude = data.get('longitude')

        if not latitude or not longitude:
            return jsonify({'error': 'Invalid coordinates'}), 400

        # Call Google Geocoding API
        url = f"https://maps.googleapis.com/maps/api/geocode/json?latlng={latitude},{longitude}&key={google_maps_api_key}"
        response = requests.get(url)

        if response.status_code == 200:
            geocode_result = response.json()
            if geocode_result.get('results'):
                address = geocode_result['results'][0]['formatted_address']
                return jsonify({'address': address})
            else:
                return jsonify({'error': 'No address found'}), 404
        else:
            return jsonify({'error': 'Failed to fetch address'}), response.status_code
    except Exception as e:
        return jsonify({'error': str(e)}), 500



@app.route('/login')
def login():
    return render_template('login.html')

@app.route('/register')
def register():
    return render_template('register.html')

@app.route('/<restaurant>/menu')
def menu(restaurant):
    return render_template('menu.html', restaurant=restaurant)

@app.route('/order-overview')
def order_overview():
    return render_template('order.html')

if __name__ == '__main__':
    app.run(debug=True)
