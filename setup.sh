#!/bin/bash

# Ensure Docker is installed
if ! [ -x "$(command -v docker)" ]; then
  echo "Error: Docker is not installed." >&2
  exit 1
fi

# Ensure Docker Compose is installed
if ! [ -x "$(command -v docker compose)" ]; then
  echo "Error: Docker Compose is not installed." >&2
  exit 1
fi

# Add lieferspatz.com to /etc/hosts if not already present
if ! grep -q "127.0.0.1 lieferspatz.com" /etc/hosts; then
  echo "Adding lieferspatz.com to /etc/hosts (requires sudo)"
  echo "127.0.0.1 lieferspatz.com" | sudo tee -a /etc/hosts
fi

# Build and run Docker containers
echo "Building and starting Docker containers..."
docker compose up --build -d

echo "Project setup complete. Access the project at http://lieferspatz.com:8080"
