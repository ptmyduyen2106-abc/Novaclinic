#include "AuthManager.hpp"
#include <sstream>
#include <stdexcept>
#include <iostream>
#include <vector>
#include <chrono>

// ─────────────────────────────────────────────
// AuthManager — implementation
// ─────────────────────────────────────────────

AuthManager::AuthManager(const std::string& supabaseJwtSecret)
    : m_jwtSecret(supabaseJwtSecret) {}

// ── Public: validate from HTTP request ───────
AuthClaims AuthManager::validateRequest(const httplib::Request& req) const {
    auto it = req.headers.find("Authorization");
    if (it == req.headers.end()) {
        std::cerr << "[AuthManager] No Authorization header\n";
        return {};
    }

    const std::string& authHeader = it->second;
    if (authHeader.size() < 8 || authHeader.substr(0, 7) != "Bearer ") {
        std::cerr << "[AuthManager] Invalid Bearer format\n";
        return {};
    }

    return validateToken(authHeader.substr(7));
}

// ── Helper: safe string extract — trả "" nếu null/missing/non-string ──
static std::string safeString(const json& obj, const std::string& key) {
    if (!obj.contains(key)) return "";
    const auto& v = obj[key];
    if (!v.is_string()) return "";   // null, number, array, object → ""
    return v.get<std::string>();
}

// ── Public: validate raw token ────────────────
AuthClaims AuthManager::validateToken(const std::string& token) const {
    AuthClaims claims;
    try {
        json payload = decodePayload(token);
        std::cerr << "[AuthManager] JWT payload: " << payload.dump(2) << "\n";

        // Kiểm tra expiry
        if (payload.contains("exp") && payload["exp"].is_number()) {
            auto exp   = payload["exp"].get<long long>();
            auto nowTs = std::chrono::duration_cast<std::chrono::seconds>(
                std::chrono::system_clock::now().time_since_epoch()).count();
            if (nowTs > exp) {
                std::cerr << "[AuthManager] Token expired\n";
                return claims;
            }
        }

        // Kiểm tra issuer — bỏ qua nếu null/missing
        std::string iss = safeString(payload, "iss");
        if (!iss.empty() && iss.find("supabase") == std::string::npos) {
            std::cerr << "[AuthManager] Invalid issuer: " << iss << "\n";
            return claims;
        }

        // Extract sub (user id) — bắt buộc
        claims.userId = safeString(payload, "sub");

        // Extract email — có thể null
        claims.email = safeString(payload, "email");

        // Extract role — thử app_metadata.role trước, fallback sang role top-level
        // Supabase JWT: role ở top level thường là "authenticated" (không dùng)
        // Role thực tế nằm trong app_metadata hoặc user_metadata
        std::string roleStr;

        if (payload.contains("app_metadata") &&
            payload["app_metadata"].is_object()) {
            roleStr = safeString(payload["app_metadata"], "role");
        }

        // Fallback: user_metadata.role
        if (roleStr.empty() &&
            payload.contains("user_metadata") &&
            payload["user_metadata"].is_object()) {
            roleStr = safeString(payload["user_metadata"], "role");
        }

        // Không lấy top-level "role" vì Supabase set = "authenticated" cho mọi user
        // → nếu cần thì uncomment dòng dưới:
        // if (roleStr.empty()) roleStr = safeString(payload, "role");

        claims.role = roleFromString(roleStr);

        claims.valid = !claims.userId.empty();
        if (claims.valid)
            std::cerr << "[AuthManager] Token OK, userId=" << claims.userId
                      << ", role=" << roleToString(claims.role) << "\n";
        else
            std::cerr << "[AuthManager] Missing sub claim\n";

    } catch (const std::exception& e) {
        std::cerr << "[AuthManager] Token parse error: " << e.what() << "\n";
    }
    return claims;
}

// ── Middleware: require any valid auth ────────
AuthClaims AuthManager::requireAuth(
    const httplib::Request& req,
    httplib::Response& res
) const {
    auto claims = validateRequest(req);
    if (!claims.valid) {
        res.status = 401;
        res.set_content(R"({"success":false,"error":"Unauthorized","statusCode":401})",
                        "application/json");
    }
    return claims;
}

// ── Middleware: require specific role ─────────
AuthClaims AuthManager::requireRole(
    const httplib::Request& req,
    httplib::Response& res,
    std::function<bool(const AuthClaims&)> roleCheck
) const {
    auto claims = requireAuth(req, res);
    if (!claims.valid) return claims;

    if (!roleCheck(claims)) {
        claims.valid = false;
        res.status = 403;
        res.set_content(R"({"success":false,"error":"Forbidden","statusCode":403})",
                        "application/json");
    }
    return claims;
}

// ── Static helpers ────────────────────────────
UserRole AuthManager::roleFromString(const std::string& s) {
    if (s == "patient")    return UserRole::Patient;
    if (s == "doctor")     return UserRole::Doctor;
    if (s == "pharma")     return UserRole::Pharmacist;
    if (s == "admin")      return UserRole::Admin;
    return UserRole::Unknown;
}

std::string AuthManager::roleToString(UserRole r) {
    switch (r) {
        case UserRole::Patient:    return "patient";
        case UserRole::Doctor:     return "doctor";
        case UserRole::Pharmacist: return "pharma";
        case UserRole::Admin:      return "admin";
        default:                   return "unknown";
    }
}

// ── Private: decode JWT payload ───────────────
json AuthManager::decodePayload(const std::string& token) const {
    auto dot1 = token.find('.');
    auto dot2 = token.find('.', dot1 + 1);
    if (dot1 == std::string::npos || dot2 == std::string::npos)
        throw std::runtime_error("Invalid JWT format");
    std::string payloadB64  = token.substr(dot1 + 1, dot2 - dot1 - 1);
    std::string payloadJson = base64UrlDecode(payloadB64);
    return json::parse(payloadJson);
}

std::string AuthManager::base64UrlDecode(const std::string& in) const {
    std::string s = in;
    for (auto& c : s) {
        if (c == '-') c = '+';
        if (c == '_') c = '/';
    }
    while (s.size() % 4 != 0) s += '=';

    static const std::string b64chars =
        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

    std::string out;
    std::vector<int> T(256, -1);
    for (int i = 0; i < 64; i++) T[(unsigned char)b64chars[i]] = i;

    int val = 0, valb = -8;
    for (unsigned char c : s) {
        if (T[c] == -1) break;
        val = (val << 6) + T[c];
        valb += 6;
        if (valb >= 0) {
            out.push_back((char)((val >> valb) & 0xFF));
            valb -= 8;
        }
    }
    return out;
}