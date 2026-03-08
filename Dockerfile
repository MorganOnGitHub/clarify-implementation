# Use official Python image as base
FROM python:3.10-slim

# Set working directory
WORKDIR /app

# Copy requirements and install dependencies
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy all project files
COPY . .

# Expose port for FastAPI server
EXPOSE 8000

# Set environment variable for baseline model checkpoint
ENV MODEL_CHECKPOINT=checkpoint-1512

# Start FastAPI server
CMD ["python", "app.py"]
