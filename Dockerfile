FROM ubuntu:24.04

# Install necessary packages
RUN apt update && apt install -y build-essential cmake libasio-dev

# Copy Crow library and source files
COPY ../Crow /Crow
COPY ./src /app/src
COPY ./CMakeLists.txt /app/CMakeLists.txt

# Build application
WORKDIR /app
RUN mkdir -p build && cd build \
    && cmake .. \
    && make

# Expose port
EXPOSE 8080

# Run the application
CMD ["./build/FinanceTrackerCPP"]
