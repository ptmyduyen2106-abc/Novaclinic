#pragma once
#include <string>
#include <unordered_map>
#include <functional>
#include "../libs/json.hpp"
#include "../libs/httplib.h"

using json = nlohmann::json;

// ─────────────────────────────────────────────
// UserRole — khớp với DB check constraint
// ─────────────────────────────────────────────
enum class UserRole {
    Patient,
    Doctor,
    Pharmacist,
    Admin,
    Unknown
};

// ─────────────────────────────────────────────
// AuthClaims — thông tin extract từ JWT
// ─────────────────────────────────────────────
struct AuthClaims {
    std::string userId;
    std::string email;
    UserRole    role    = UserRole::Unknown;
    bool        valid   = false;

    bool isPatient()    const { return role == UserRole::Patient; }
    bool isDoctor()     const { return role == UserRole::Doctor; }
    bool isPharmacist() const { return role == UserRole::Pharmacist; }
    bool isAdmin()      const { return role == UserRole::Admin; }

    bool canAccessDoctor()   const { return isDoctor()     || isAdmin(); }
    bool canAccessPharmacy() const { return isPharmacist() || isAdmin(); }
    bool canAccessFinance()  const { return isAdmin(); }
    bool canAccessOwnData()  const { return isPatient()    || isAdmin(); }
};

// ─────────────────────────────────────────────
// AuthManager — xác thực token Supabase JWT
// Supabase dùng RS256 (asymmetric) nên chỉ
// decode payload + kiểm tra exp/iss, không
// verify signature bằng secret
// ─────────────────────────────────────────────
class AuthManager {
public:
    explicit AuthManager(const std::string& supabaseJwtSecret);

    AuthClaims validateRequest(const httplib::Request& req) const;
    AuthClaims validateToken(const std::string& token) const;

    AuthClaims requireAuth(
        const httplib::Request& req,
        httplib::Response& res
    ) const;

    AuthClaims requireRole(
        const httplib::Request& req,
        httplib::Response& res,
        std::function<bool(const AuthClaims&)> roleCheck
    ) const;

    static UserRole    roleFromString(const std::string& s);
    static std::string roleToString(UserRole r);

private:
    std::string m_jwtSecret;  // giữ lại để không break interface

    json        decodePayload(const std::string& token) const;
    std::string base64UrlDecode(const std::string& in) const;
};