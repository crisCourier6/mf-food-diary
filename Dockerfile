# Use an official Node.js runtime as a parent image
FROM node:alpine AS build

# Set the working directory
WORKDIR /mf-food-diary

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of your application code
COPY . .

# Build the React app
RUN npm run build

# Use a lightweight web server for the final image
FROM node:alpine

# Install the serve package globally
RUN npm install -g serve

# Set the working directory
WORKDIR /app

# Copy the build output from the previous stage
COPY --from=build /mf-food-diary/dist ./dist

# Expose the desired port
EXPOSE 2013

# Run the static file server
CMD ["serve", "-s", "dist", "-l", "2013"]
