#include "crow.h"
#include <fstream>
#include <vector>
#include <string>
#include <algorithm>

// Use the standard namespace and Crow namespace
using namespace std;
using namespace crow;

/**
 * Transaction struct - Represents a financial transaction in the system
 * Contains all relevant transaction data like ID, description, amount, type and date
 */
struct Transaction
{
    int id;             // Unique identifier for the transaction
    string description; // Description of what the transaction is for
    double amount;      // Monetary value of the transaction
    string type;        // Transaction type (e.g., "income", "expense")
    string date;        // Date when the transaction occurred
};

// Global storage for transactions (would be replaced by a database in production)
vector<Transaction> transactions;
int next_id = 1; // Auto-increment counter for transaction IDs

/**
 * Helper function to add CORS headers to all responses
 * This enables cross-origin requests which is important for separating frontend/backend
 */
void add_cors_headers(response &res)
{
    res.set_header("Access-Control-Allow-Origin", "*");
    res.set_header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.set_header("Access-Control-Allow-Headers", "Content-Type");
}

/**
 * Handle OPTIONS requests for CORS preflight
 * Modern browsers send this before actual requests to check if they're allowed
 */
response handle_options(const request &, string)
{
    response res(204); // 204 = No Content for OPTIONS requests
    add_cors_headers(res);
    return res;
}

/**
 * Get all transactions
 * Returns an array of all transactions in the system
 */
response get_all_transactions()
{
    // Always returns an array (empty if no transactions exist)
    json::wvalue response_json = json::wvalue::list();

    for (size_t i = 0; i < transactions.size(); i++)
    {
        response_json[i]["id"] = transactions[i].id;
        response_json[i]["description"] = transactions[i].description;
        response_json[i]["amount"] = transactions[i].amount;
        response_json[i]["type"] = transactions[i].type;
        response_json[i]["date"] = transactions[i].date;
    }

    response res(response_json);
    add_cors_headers(res);
    return res;
}

/**
 * Create a new transaction
 * Parses the JSON request body and creates a new transaction
 */
response create_transaction(const request &req)
{
    response res;

    // Parse JSON from request body
    auto json = json::load(req.body);
    if (!json)
    {
        // Invalid JSON in request body
        res = response(400, "Invalid JSON");
    }
    else
    {
        try
        {
            // Extract transaction data from request JSON
            Transaction t;
            t.id = next_id++;
            t.description = json["description"].s();
            t.amount = json["amount"].d();
            t.type = json["type"].s();
            t.date = json["date"].s();

            // Add to our in-memory store
            transactions.push_back(t);

            // Prepare and send success response
            json::wvalue response_json;
            response_json["id"] = t.id;
            response_json["message"] = "Transaction created successfully";

            res = response(201, response_json); // 201 = Created
        }
        catch (const exception &e)
        {
            // Handle any errors during transaction creation
            res = response(400, string("Bad request: ") + e.what());
        }
    }

    add_cors_headers(res);
    return res;
}

/**
 * Handle requests for the transactions collection endpoint
 * Routes to the appropriate handler based on HTTP method
 */
response handle_transactions(const request &req)
{
    if (req.method == HTTPMethod::GET)
    {
        return get_all_transactions();
    }
    else if (req.method == HTTPMethod::POST)
    {
        return create_transaction(req);
    }
    else
    {
        // Unsupported HTTP method
        response res(405, "Method not allowed");
        add_cors_headers(res);
        return res;
    }
}

/**
 * Get a specific transaction by ID
 */
response get_transaction(int id)
{
    response res;

    for (const auto &t : transactions)
    {
        if (t.id == id)
        {
            // Transaction found, prepare JSON response
            json::wvalue response_json;
            response_json["id"] = t.id;
            response_json["description"] = t.description;
            response_json["amount"] = t.amount;
            response_json["type"] = t.type;
            response_json["date"] = t.date;

            res = response(response_json);
            break;
        }
    }

    if (res.code == 0)
    { // Response not set yet = transaction not found
        res = response(404, "Transaction not found");
    }

    add_cors_headers(res);
    return res;
}

/**
 * Delete a transaction by ID
 */
response delete_transaction(int id)
{
    response res;

    auto it = find_if(
        transactions.begin(),
        transactions.end(),
        [id](const Transaction &t)
        { return t.id == id; });

    if (it != transactions.end())
    {
        // Transaction found, remove it
        transactions.erase(it);
        res = response(204); // 204 = No content (success but nothing to return)
    }
    else
    {
        // Transaction not found
        res = response(404, "Transaction not found");
    }

    add_cors_headers(res);
    return res;
}

/**
 * Handle requests for specific transaction by ID
 * Routes to the appropriate handler based on HTTP method
 */
response handle_transaction_by_id(const request &req, int id)
{
    if (req.method == HTTPMethod::GET)
    {
        return get_transaction(id);
    }
    else if (req.method == HTTPMethod::DELETE)
    {
        return delete_transaction(id);
    }
    else
    {
        // Unsupported HTTP method
        response res(405, "Method not allowed");
        add_cors_headers(res);
        return res;
    }
}

/**
 * Health check endpoint
 * Returns a simple JSON response indicating the service is healthy
 */
response health_check()
{
    json::wvalue response_json;
    response_json["status"] = "healthy";

    response res(response_json);
    add_cors_headers(res);
    return res;
}

/**
 * Serve static files from the frontend/dist directory
 */
response serve_static_file(const request &, string path)
{
    // Default to index.html if no path specified
    if (path.empty())
        path = "index.html";

    // Security check to prevent directory traversal attacks
    if (path.find("..") != string::npos)
    {
        response res(403, "Forbidden");
        add_cors_headers(res);
        return res;
    }

    // Build the file path and open the file
    string file_path = string("./public/") + path;
    ifstream file(file_path.c_str(), ios::binary);

    if (!file.good())
    {
        // File not found, try index.html as fallback
        // This is useful for single-page applications with client-side routing
        file_path = "./public/index.html";
        file = ifstream(file_path.c_str(), ios::binary);

        if (!file.good())
        {
            // Still not found, return 404
            response res(404, "File not found");
            add_cors_headers(res);
            return res;
        }
    }

    // Read the file content into a string
    string file_content((istreambuf_iterator<char>(file)), istreambuf_iterator<char>());

    // Set content type based on file extension for proper browser rendering
    string content_type = "text/plain";
    size_t ext_pos = path.find_last_of('.');
    if (ext_pos != string::npos)
    {
        string ext = path.substr(ext_pos);
        if (ext == ".html")
            content_type = "text/html";
        else if (ext == ".css")
            content_type = "text/css";
        else if (ext == ".js")
            content_type = "application/javascript";
        else if (ext == ".json")
            content_type = "application/json";
        else if (ext == ".png")
            content_type = "image/png";
        else if (ext == ".jpg" || ext == ".jpeg")
            content_type = "image/jpeg";
        else if (ext == ".svg")
            content_type = "image/svg+xml";
        else if (ext == ".ico")
            content_type = "image/x-icon";
    }

    // Create and configure the response
    response res;
    res.set_header("Content-Type", content_type);
    res.body = file_content;
    add_cors_headers(res);
    return res;
}

/**
 * Serve the root index.html file
 */
response serve_index()
{
    // Try to open the main index.html file
    ifstream file("./public/index.html", ios::binary);
    if (!file.good())
    {
        // Frontend files not found, probably not built yet
        response res(404, "Frontend not built");
        add_cors_headers(res);
        return res;
    }

    // Read the file content into a string
    string file_content((istreambuf_iterator<char>(file)), istreambuf_iterator<char>());

    // Create and configure the response
    response res;
    res.set_header("Content-Type", "text/html");
    res.body = file_content;
    add_cors_headers(res);
    return res;
}

/**
 * Main function that sets up and starts the server
 */
int main()
{
    // Initialize Crow web application
    SimpleApp app;

    // Set up routes
    CROW_ROUTE(app, "/api/<path>").methods(HTTPMethod::OPTIONS)(handle_options);
    CROW_ROUTE(app, "/api/transactions").methods(HTTPMethod::GET, HTTPMethod::POST)(handle_transactions);
    CROW_ROUTE(app, "/api/transactions/<int>").methods(HTTPMethod::GET, HTTPMethod::DELETE)(handle_transaction_by_id);
    CROW_ROUTE(app, "/api/health").methods(HTTPMethod::GET)(health_check);
    CROW_ROUTE(app, "/<path>")(serve_static_file);
    CROW_ROUTE(app, "/")(serve_index);

    // Start the Crow application on port 8080, listening on all interfaces
    // Use multithreaded mode for better performance
    app.bindaddr("0.0.0.0").port(8080).multithreaded().run();
}