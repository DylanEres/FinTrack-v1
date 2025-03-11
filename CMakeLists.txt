cmake_minimum_required(VERSION 3.16)
project(FinanceTrackerCPP)

set(CMAKE_CXX_STANDARD 17)

# Include Crow headers
include_directories(${CMAKE_SOURCE_DIR}/../Crow/include)

# Define executable
add_executable(FinanceTrackerCPP src/main.cpp)

# Link libraries
target_link_libraries(FinanceTrackerCPP pthread)
