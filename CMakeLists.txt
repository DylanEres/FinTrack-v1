cmake_minimum_required(VERSION 3.16)
project(FinanceTrackerCPP)

set(CMAKE_CXX_STANDARD 17)

# Include Crow headers
include_directories(${CMAKE_SOURCE_DIR}/../Crow/include)

# Define executable
add_executable(FinanceTrackerCPP ${CMAKE_SOURCE_DIR}/src/main.cpp)

# Find and link dependencies
find_package(Threads REQUIRED)
target_link_libraries(FinanceTrackerCPP PRIVATE Threads::Threads)

# Add filesystem library for C++17
target_link_libraries(FinanceTrackerCPP PRIVATE stdc++fs)