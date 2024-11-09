# Use an official Python runtime as a parent image
FROM python:3.9

# Set the working directory in the container to /app/backend
WORKDIR /app/backend

# Copy the current directory contents into the container at /app
COPY . /app

# Install any dependencies specified in requirements.txt
RUN pip install --no-cache-dir -r /app/requirements.txt

# Expose port 5000 for the Flask app
EXPOSE 5000

# Set environment variables for Flask
ENV FLASK_APP=app.py
ENV FLASK_RUN_HOST=0.0.0.0

# Run the Flask app
CMD ["flask", "run"]
