# Use official lightweight Python image
FROM python:3.9-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV HOME=/home/user
ENV PATH=/home/user/.local/bin:$PATH

# Create a non-root user
RUN useradd -m -u 1000 user

# Set working directory inside the container
WORKDIR $HOME/app

# Install system dependencies (e.g., git, and exiftool for metadata check)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libimage-exiftool-perl \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install dependencies
COPY --chown=user requirements.txt .
RUN pip install --no-cache-dir --upgrade -r requirements.txt

# Copy the rest of the application files
COPY --chown=user . .

# Set the user to run the container
USER user

# Expose port 7860 (Hugging Face Spaces requirement)
EXPOSE 7860

# Run uvicorn on port 7860
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "7860"]
