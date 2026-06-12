FROM node:18-alpine
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy application code
COPY . .

# Expose the service port
EXPOSE 8086

# Start the Node.js application
CMD ["npm", "start"]
