// ============================================================
// RegisterHandler.cpp
// Implementation handler POST /api/register
// Đặt tại: backend/src/api/RegisterHandler.cpp
// ============================================================

#include "RegisterHandler.hpp"
#include <cstdlib>   // getenv
#include <regex>
#include <stdexcept>

#include <fstream>
#include <string>

// ============================================================
// Helpers lấy biến môi trường (Đã nâng cấp đọc từ file .env)
// ============================================================
static std::string get_env(const char* name) {
    const char* val = std::getenv(name);
    if (val) return val;

    std::ifstream file(".env");
    std::string line;
    std::string prefix = std::string(name) + "=";

    if (file.is_open()) {
        while (std::getline(file, line)) {
            if (line.find(prefix) == 0) {
                std::string res = line.substr(prefix.length());
                if (!res.empty() && res.back() == '\r') res.pop_back();
                if (res.size() >= 2 && ((res.front() == '"' && res.back() == '"') || 
                                        (res.front() == '\'' && res.back() == '\''))) {
                    res = res.substr(1, res.size() - 2);
                }
                return res;
            }
        }
    }
    throw std::runtime_error(std::string("Thiếu biến môi trường: ") + name);
}

static std::string supabase_url() {
    static std::string v = get_env("SUPABASE_URL");
    return v;
}

static std::string supabase_anon_key() {
    static std::string v = get_env("SUPABASE_ANON_KEY");
    return v;
}

static std::string supabase_service_key() {
    static std::string v = get_env("SUPABASE_SERVICE_ROLE_KEY");
    return v;
}

// Trích hostname từ URL "https://xxxx.supabase.co" → "xxxx.supabase.co"
static std::string host_from_url(const std::string& url) {
    auto pos = url.find("://");
    return (pos != std::string::npos) ? url.substr(pos + 3) : url;
}

// ============================================================
// RegisterValidate
// ============================================================
bool RegisterValidate::phone_vn(const std::string& phone) {
    static const std::regex re(R"(^(0[35789])\d{8}$)");
    return std::regex_match(phone, re);
}

bool RegisterValidate::email(const std::string& addr) {
    static const std::regex re(R"(^[^\s@]+@[^\s@]+\.[^\s@]+$)");
    return std::regex_match(addr, re);
}

bool RegisterValidate::id_number(const std::string& id) {
    static const std::regex re(R"(^\d{9,12}$)");
    return std::regex_match(id, re);
}

bool RegisterValidate::date_of_birth(const std::string& dob) {
    static const std::regex re(R"(^\d{4}-\d{2}-\d{2}$)");
    return std::regex_match(dob, re);
}

std::string RegisterValidate::check_body(const json& body) {
    auto has = [&](const std::string& key) -> bool {
        return body.contains(key)
            && body[key].is_string()
            && !body[key].get<std::string>().empty();
    };

    if (!has("full_name"))      return "Thiếu họ tên (full_name)";
    if (!has("date_of_birth"))  return "Thiếu ngày sinh (date_of_birth)";
    if (!date_of_birth(body["date_of_birth"].get<std::string>()))
                                return "Ngày sinh không hợp lệ, dùng định dạng YYYY-MM-DD";
    if (!has("gender"))         return "Thiếu giới tính (gender)";
    auto g = body["gender"].get<std::string>();
    if (g != "male" && g != "female" && g != "other")
                                return "Giới tính không hợp lệ (male/female/other)";
    if (!has("id_number"))      return "Thiếu số CCCD/CMND (id_number)";
    if (!id_number(body["id_number"].get<std::string>()))
                                return "Số CCCD/CMND không hợp lệ (9–12 chữ số)";
    if (!has("phone"))          return "Thiếu số điện thoại (phone)";
    if (!phone_vn(body["phone"].get<std::string>()))
                                return "Số điện thoại không hợp lệ";
    if (!has("email"))          return "Thiếu email";
    if (!email(body["email"].get<std::string>()))
                                return "Email không hợp lệ";
    if (!has("address"))        return "Thiếu địa chỉ (address)";
    if (!has("username"))       return "Thiếu tên đăng nhập (username)";
    if (body["username"].get<std::string>().size() < 4)
                                return "Tên đăng nhập phải có ít nhất 4 ký tự";
    if (!has("password"))       return "Thiếu mật khẩu (password)";
    if (body["password"].get<std::string>().size() < 8)
                                return "Mật khẩu phải có ít nhất 8 ký tự";
    return "";
}

// ============================================================
// RegisterSupabase
// ============================================================

// Gọi Supabase Auth: POST /auth/v1/signup
RegisterSupabase::Result RegisterSupabase::signup_auth(
    const std::string& email,
    const std::string& password)
{
    std::string host = host_from_url(supabase_url());
    std::string anon = supabase_anon_key();

    httplib::SSLClient cli(host.c_str());
    cli.set_connection_timeout(10);
    cli.set_read_timeout(15);

    json payload = {{"email", email}, {"password", password}};

    httplib::Headers headers = {
        {"apikey",        anon},
        {"Authorization", "Bearer " + anon},
        {"Content-Type",  "application/json"}
    };

    auto res = cli.Post("/auth/v1/signup",
                        headers,
                        payload.dump(),
                        "application/json");

    if (!res) return {503, {{"error", "Không kết nối được Supabase Auth"}}};

    json resp;
    try { resp = json::parse(res->body); }
    catch (...) { resp = {{"raw", res->body}}; }

    return {res->status, resp};
}

// Gọi Supabase REST: POST /rest/v1/patients
// Dùng service_role key để bypass RLS
RegisterSupabase::Result RegisterSupabase::insert_patient(
    const std::string& user_id,
    const json&        body)
{
    std::string host    = host_from_url(supabase_url());
    std::string svc_key = supabase_service_key();

    httplib::SSLClient cli(host.c_str());
    cli.set_connection_timeout(10);
    cli.set_read_timeout(15);

    json patient = {
        {"id",            user_id},
        {"full_name",     body["full_name"].get<std::string>()},
        {"date_of_birth", body["date_of_birth"].get<std::string>()},
        {"gender",        body["gender"].get<std::string>()},
        {"id_number",     body["id_number"].get<std::string>()},
        {"phone",         body["phone"].get<std::string>()},
        {"address",       body["address"].get<std::string>()},
        {"username",      body["username"].get<std::string>()}
    };

    httplib::Headers headers = {
        {"apikey",        svc_key},
        {"Authorization", "Bearer " + svc_key},
        {"Content-Type",  "application/json"},
        {"Prefer",        "return=representation"}
    };

    auto res = cli.Post("/rest/v1/patients",
                        headers,
                        patient.dump(),
                        "application/json");

    if (!res) return {503, {{"error", "Không kết nối được Supabase REST"}}};

    json resp;
    try { resp = json::parse(res->body); }
    catch (...) { resp = {{"raw", res->body}}; }

    return {res->status, resp};
}

// ============================================================
// Handler chính
// ============================================================
void register_handler(const httplib::Request& req,
                      httplib::Response&      res)
{
    res.set_header("Content-Type", "application/json");

    // 1. Parse JSON body
    json body;
    try {
        body = json::parse(req.body);
    } catch (...) {
        res.status = 400;
        res.body   = json{{"success", false},
                          {"error",   "Body không phải JSON hợp lệ"}}.dump();
        return;
    }

    // 2. Validate
    std::string err = RegisterValidate::check_body(body);
    if (!err.empty()) {
        res.status = 422;
        res.body   = json{{"success", false}, {"error", err}}.dump();
        return;
    }

    // 3. Tạo user trong Supabase Auth
    auto auth = RegisterSupabase::signup_auth(
        body["email"].get<std::string>(),
        body["password"].get<std::string>()
    );

    if (auth.status != 200) {
        std::string msg = "Đăng ký thất bại";
        if (auth.body.contains("msg"))
            msg = auth.body["msg"].get<std::string>();
        else if (auth.body.contains("error_description"))
            msg = auth.body["error_description"].get<std::string>();
        else if (auth.body.contains("error"))
            msg = auth.body["error"].get<std::string>();

        res.status = (auth.status == 422) ? 409 : auth.status;
        res.body   = json{{"success", false}, {"error", msg}}.dump();
        return;
    }

    // 4. Lấy user_id
    std::string user_id;
    try {
        user_id = auth.body["id"].get<std::string>();
    } catch (...) {
        res.status = 500;
        res.body   = json{{"success", false},
                          {"error",   "Không lấy được user_id từ Supabase Auth"}}.dump();
        return;
    }

    // 5. Insert profile vào bảng patients
    auto db = RegisterSupabase::insert_patient(user_id, body);

    if (db.status != 201) {
        std::string msg = "Lưu thông tin bệnh nhân thất bại";
        if (db.body.is_array() && !db.body.empty()
            && db.body[0].contains("message"))
            msg = db.body[0]["message"].get<std::string>();
        else if (db.body.contains("message"))
            msg = db.body["message"].get<std::string>();

        // TODO: xoá auth user nếu insert thất bại (rollback)
        // DELETE /auth/v1/admin/users/{user_id} với service_role key

        res.status = 500;
        res.body   = json{{"success", false}, {"error", msg}}.dump();
        return;
    }

    // 6. Thành công
    res.status = 201;
    res.body   = json{
        {"success",  true},
        {"message",  "Đăng ký thành công. Vui lòng kiểm tra email để xác thực tài khoản."},
        {"user_id",  user_id}
    }.dump();
}