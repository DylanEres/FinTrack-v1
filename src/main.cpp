#include "crow.h"

int main() {
    crow::SimpleApp app;

    // Root Route with CORS
    CROW_ROUTE(app, "/")([]() {
        crow::response res("Hello, FinanceTrackerCPP!");
        res.set_header("Access-Control-Allow-Origin", "*"); // Allow all origins
        res.set_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
        res.set_header("Access-Control-Allow-Headers", "Content-Type");
        return res;
    });

    // Health Check with CORS
    CROW_ROUTE(app, "/health")([]() {
        crow::response res(200, "Healthy");
        res.set_header("Access-Control-Allow-Origin", "*");
        return res;
    });

    // Handle OPTIONS requests for CORS Preflight
    CROW_ROUTE(app, "/<string>")([](const crow::request&, std::string) {
        crow::response res(204); // No Content response
        res.set_header("Access-Control-Allow-Origin", "*");
        res.set_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
        res.set_header("Access-Control-Allow-Headers", "Content-Type");
        return res;
    });

    app.bindaddr("0.0.0.0").port(8080).multithreaded().run();
}
