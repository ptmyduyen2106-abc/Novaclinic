#pragma once

// ============================================================
// RegisterHandler.hpp
// Khai báo handler POST /api/register
// Đặt tại: backend/src/api/RegisterHandler.hpp
// ============================================================

#include "../../libs/httplib.h"
#include "../../libs/json.hpp"
#include <string>

using json = nlohmann::json;

// ============================================================
// Validation helpers (dùng nội bộ, khai báo ở đây để test)
// ============================================================
namespace RegisterValidate {
    bool phone_vn(const std::string& phone);
    bool email(const std::string& addr);
    bool id_number(const std::string& id);
    bool date_of_birth(const std::string& dob);
    std::string check_body(const json& body); // trả về "" nếu OK, lỗi nếu sai
}

// ============================================================
// Supabase API calls (dùng SupabaseClient nếu đã có,
// hoặc dùng trực tiếp httplib — xem RegisterHandler.cpp)
// ============================================================
namespace RegisterSupabase {
    struct Result {
        int  status;
        json body;
    };

    Result signup_auth(const std::string& email,
                       const std::string& password);

    Result insert_patient(const std::string& user_id,
                          const json& body);
}

// ============================================================
// Handler chính — gắn vào HttpServer:
//   svr.Post("/api/register", register_handler);
// ============================================================
void register_handler(const httplib::Request& req,
                      httplib::Response&      res);