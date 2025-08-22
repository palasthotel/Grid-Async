# Use Node.js 18 LTS as the base image (more secure and still compatible)
FROM node:18-alpine

# Set the working directory in the container
WORKDIR /app

# Copy package.json files first (for better Docker layer caching)
COPY package.json ./
COPY plug/package.json ./plug/

# Install dependencies
RUN npm install
RUN cd plug && npm install

# Copy the rest of the application code
COPY . .

# Copy config.prod.js to config.js as required
RUN cp config.prod.js config.js

# Create a non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S griduser -u 1001

# Change ownership of the app directory to the nodejs user
RUN chown -R griduser:nodejs /app
USER griduser

# Expose the port the app runs on
EXPOSE 61100

# Define the command to run the application
CMD ["npm", "start"]
