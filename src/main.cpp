#include "crow.h"
#include <fstream>
#include <vector>
#include <string>

// In-memory storage for transactions (for now)
struct Transaction
{
    int id;
    std::string description;
    double amount;
    std::string type;
    std::string date;
};

int main()
{
    crow::SimpleApp app;

    // In-memory storage for transactions
    std::vector<Transaction> transactions;
    int next_id = 1;

    // Helper function to add CORS headers to all responses
    auto add_cors_headers = [](crow::response &res)
    {
        res.set_header("Access-Control-Allow-Origin", "*");
        res.set_header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
        res.set_header("Access-Control-Allow-Headers", "Content-Type");
    };

    // Handle OPTIONS requests for CORS preflight
    CROW_ROUTE(app, "/api/<path>")
        .methods(crow::HTTPMethod::OPTIONS)([&](const crow::request &, std::string)
                                            {
        crow::response res(204); // No Content for OPTIONS
        add_cors_headers(res);
        return res; });

    // API Routes
    CROW_ROUTE(app, "/api/transactions")
        .methods(crow::HTTPMethod::GET, crow::HTTPMethod::POST)([&](const crow::request &req)
                                                                {
        crow::response res;
        
        if (req.method == crow::HTTPMethod::GET) {
            // Even if there are no transactions, return an empty array
            // This change ensures the frontend receives a valid response
            crow::json::wvalue response = crow::json::wvalue::list();
            
            for (size_t i = 0; i < transactions.size(); i++) {
                response[i]["id"] = transactions[i].id;
                response[i]["description"] = transactions[i].description;
                response[i]["amount"] = transactions[i].amount;
                response[i]["type"] = transactions[i].type;
                response[i]["date"] = transactions[i].date;
            }
            
            res = crow::response(response);
        } else if (req.method == crow::HTTPMethod::POST) {
                auto json = crow::json::load(req.body);
                if (!json) {
                    res = crow::response(400, "Invalid JSON");
                } else {
                    try {
                        Transaction t;
                        t.id = next_id++;
                        t.description = json["description"].s();
                        t.amount = json["amount"].d();
                        t.type = json["type"].s();
                        t.date = json["date"].s();
                        
                        transactions.push_back(t);
                        
                        crow::json::wvalue response;
                        response["id"] = t.id;
                        response["message"] = "Transaction created successfully";
                        
                        res = crow::response(201, response);
                    } catch (const std::exception& e) {
                        res = crow::response(400, std::string("Bad request: ") + e.what());
                    }
                }
            } else {
                res = crow::response(405, "Method not allowed");
            }
            
            add_cors_headers(res);
            return res; });

    CROW_ROUTE(app, "/api/transactions/<int>")
        .methods(crow::HTTPMethod::GET, crow::HTTPMethod::DELETE)([&](const crow::request &req, int id)
                                                                  {
            crow::response res;
            
            if (req.method == crow::HTTPMethod::GET) {
                for (const auto& t : transactions) {
                    if (t.id == id) {
                        crow::json::wvalue response;
                        response["id"] = t.id;
                        response["description"] = t.description;
                        response["amount"] = t.amount;
                        response["type"] = t.type;
                        response["date"] = t.date;
                        
                        res = crow::response(response);
                        break;
                    }
                }
                
                if (res.code == 0) { // Not set yet
                    res = crow::response(404, "Transaction not found");
                }
            } else if (req.method == crow::HTTPMethod::DELETE) {
                auto it = std::find_if(
                    transactions.begin(), 
                    transactions.end(), 
                    [id](const Transaction& t) { return t.id == id; }
                );
                
                if (it != transactions.end()) {
                    transactions.erase(it);
                    res = crow::response(204); // No content response
                } else {
                    res = crow::response(404, "Transaction not found");
                }
            } else {
                res = crow::response(405, "Method not allowed");
            }
            
            add_cors_headers(res);
            return res; });

    // Health Check
    CROW_ROUTE(app, "/api/health")
        .methods(crow::HTTPMethod::GET)([&add_cors_headers]()
                                        {
            crow::json::wvalue response;
            response["status"] = "healthy";
            auto res = crow::response(response);
            add_cors_headers(res);
            return res; });

    // Serve static files from the frontend/dist directory
    CROW_ROUTE(app, "/<path>")
    ([&add_cors_headers](const crow::request &, std::string path)
     {
        if (path.empty()) path = "index.html";
        
        // Security check to prevent directory traversal
        if (path.find("..") != std::string::npos) {
            auto res = crow::response(403, "Forbidden");
            add_cors_headers(res);
            return res;
        }
        
        std::string file_path = std::string("./frontend/dist/") + path;
        std::ifstream file(file_path.c_str(), std::ios::binary);
        
        if (!file.good()) {
            // Try index.html as fallback (for client-side routing)
            file_path = "./frontend/dist/index.html";
            file = std::ifstream(file_path.c_str(), std::ios::binary);
            
            if (!file.good()) {
                auto res = crow::response(404, "File not found");
                add_cors_headers(res);
                return res;
            }
        }
        
        // Read the file
        std::string file_content((std::istreambuf_iterator<char>(file)), std::istreambuf_iterator<char>());
        
        // Set content type based on file extension
        std::string content_type = "text/plain";
        size_t ext_pos = path.find_last_of('.');
        if (ext_pos != std::string::npos) {
            std::string ext = path.substr(ext_pos);
            if (ext == ".html") content_type = "text/html";
            else if (ext == ".css") content_type = "text/css";
            else if (ext == ".js") content_type = "application/javascript";
            else if (ext == ".json") content_type = "application/json";
            else if (ext == ".png") content_type = "image/png";
            else if (ext == ".jpg" || ext == ".jpeg") content_type = "image/jpeg";
            else if (ext == ".svg") content_type = "image/svg+xml";
            else if (ext == ".ico") content_type = "image/x-icon";
        }
        
        crow::response res;
        res.set_header("Content-Type", content_type);
        res.body = file_content;
        add_cors_headers(res);
        return res; });

    // Default route to serve index.html
    CROW_ROUTE(app, "/")
    ([&add_cors_headers]()
     {
        std::ifstream file("./frontend/dist/index.html", std::ios::binary);
        if (!file.good()) {
            auto res = crow::response(404, "Frontend not built");
            add_cors_headers(res);
            return res;
        }
        
        std::string file_content((std::istreambuf_iterator<char>(file)), std::istreambuf_iterator<char>());
        
        crow::response res;
        res.set_header("Content-Type", "text/html");
        res.body = file_content;
        add_cors_headers(res);
        return res; });

    app.bindaddr("0.0.0.0").port(8080).multithreaded().run();
}