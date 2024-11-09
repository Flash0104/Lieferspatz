## Project Overview
Lieferspatz is a food delivery service application designed to connect customers with local restaurants and provide a seamless ordering experience.

## Features
- View nearby restaurants
- Order food and track the delivery status
- Integrated payment system

## Quick Start for http://lieferspatz.com (local+docker)

1. Clone the repository.
2. Run the setup script (this only needs to be done once):
   ```bash
   chmod +x setup.sh
   ./setup.sh
3. Access the project at http://lieferspatz.com:8080.

---

### How This Solution Works

- **Automates Setup**: Users only need to run the `setup.sh` script once.
- **No Manual Hosts File Editing**: The script takes care of adding `lieferspatz.com` to `/etc/hosts`.
- **Docker Networking**: The `extra_hosts` entry in `docker-compose.yml` ensures the app works inside the Docker environment.

This setup should provide a smooth experience without extensive manual steps. Would you like further customization or additional troubleshooting for this setup?
