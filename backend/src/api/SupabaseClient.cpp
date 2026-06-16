#include "SupabaseClient.hpp"
#include <sstream>
#include <stdexcept>

// ─────────────────────────────────────────────
// Constructor — parse projectUrl → host
// e.g. "https://pvmylmgywyyzuptnbwup.supabase.co"
// ─────────────────────────────────────────────
SupabaseClient::SupabaseClient(const std::string& projectUrl,
                               const std::string& serviceRoleKey)
    : m_serviceKey(serviceRoleKey), m_basePath("/rest/v1")
{
    // Strip "https://" or "http://"
    std::string url = projectUrl;
    for (const auto& prefix : { "https://", "http://" }) {
        if (url.rfind(prefix, 0) == 0) {
            url = url.substr(std::string(prefix).size());
            break;
        }
    }
    // Strip trailing slash
    if (!url.empty() && url.back() == '/') url.pop_back();
    m_host = url;
}

// ─────────────────────────────────────────────
// Headers
// ─────────────────────────────────────────────
httplib::Headers SupabaseClient::buildHeaders(bool preferCount) const {
    httplib::Headers h = {
        { "apikey",        m_serviceKey },
        { "Authorization", "Bearer " + m_serviceKey },
        { "Content-Type",  "application/json" },
        { "Accept",        "application/json" },
        { "Prefer",        preferCount ? "count=exact" : "return=representation" }
    };
    return h;
}

// ─────────────────────────────────────────────
// Low-level HTTP
// ─────────────────────────────────────────────
DbResult<json> SupabaseClient::doGet(const std::string& path) const {
    httplib::SSLClient cli(m_host);
    cli.set_connection_timeout(10);
    cli.set_read_timeout(15);

    auto res = cli.Get(path, buildHeaders());
    if (!res)
        return DbResult<json>::err("Network error: no response", 503);
    if (res->status >= 400)
        return DbResult<json>::err(res->body, res->status);

    try {
        return DbResult<json>::ok(json::parse(res->body));
    } catch (...) {
        return DbResult<json>::err("JSON parse error", 500);
    }
}

DbResult<json> SupabaseClient::doPost(const std::string& path,
                                       const json& body) const {
    httplib::SSLClient cli(m_host);
    cli.set_connection_timeout(10);
    cli.set_read_timeout(15);

    auto res = cli.Post(path, buildHeaders(), body.dump(), "application/json");
    if (!res)
        return DbResult<json>::err("Network error: no response", 503);
    if (res->status >= 400)
        return DbResult<json>::err(res->body, res->status);

    try {
        return DbResult<json>::ok(json::parse(res->body));
    } catch (...) {
        return DbResult<json>::err("JSON parse error", 500);
    }
}

DbResult<json> SupabaseClient::doPatch(const std::string& path,
                                        const json& body) const {
    httplib::SSLClient cli(m_host);
    cli.set_connection_timeout(10);
    cli.set_read_timeout(15);

    auto res = cli.Patch(path, buildHeaders(), body.dump(), "application/json");
    if (!res)
        return DbResult<json>::err("Network error: no response", 503);
    if (res->status >= 400)
        return DbResult<json>::err(res->body, res->status);

    try {
        return DbResult<json>::ok(json::parse(res->body));
    } catch (...) {
        return DbResult<json>::err("JSON parse error", 500);
    }
}

DbResult<void> SupabaseClient::doDelete(const std::string& path) const {
    httplib::SSLClient cli(m_host);
    cli.set_connection_timeout(10);
    cli.set_read_timeout(15);

    auto res = cli.Delete(path, buildHeaders());
    if (!res)
        return DbResult<void>::err("Network error: no response", 503);
    if (res->status >= 400)
        return DbResult<void>::err(res->body, res->status);

    return DbResult<void>::ok();
}

// ─────────────────────────────────────────────
// Date helper — "2024-06" → ("2024-06-01", "2024-06-30")
// ─────────────────────────────────────────────
std::pair<std::string, std::string>
SupabaseClient::monthRange(const std::string& month) {
    // month = "YYYY-MM"
    std::string start = month + "-01";

    int year  = std::stoi(month.substr(0, 4));
    int mon   = std::stoi(month.substr(5, 2));

    // Last day
    int lastDay = 31;
    if (mon == 4 || mon == 6 || mon == 9 || mon == 11) lastDay = 30;
    else if (mon == 2) {
        bool leap = (year % 4 == 0 && year % 100 != 0) || (year % 400 == 0);
        lastDay = leap ? 29 : 28;
    }

    char buf[12];
    snprintf(buf, sizeof(buf), "%04d-%02d-%02d", year, mon, lastDay);
    return { start, std::string(buf) };
}

// ─────────────────────────────────────────────
// Generic REST
// ─────────────────────────────────────────────
DbResult<json> SupabaseClient::query(const std::string& table,
                                      const QueryParams& params) {
    return doGet(m_basePath + "/" + table + params.toQueryString());
}

DbResult<json> SupabaseClient::insert(const std::string& table,
                                       const json& body) {
    return doPost(m_basePath + "/" + table, body);
}

DbResult<json> SupabaseClient::update(const std::string& table,
                                       const std::string& filter,
                                       const json& body) {
    QueryParams p;
    p.withFilter(filter);
    return doPatch(m_basePath + "/" + table + p.toQueryString(), body);
}

DbResult<void> SupabaseClient::remove(const std::string& table,
                                       const std::string& filter) {
    QueryParams p;
    p.withFilter(filter);
    return doDelete(m_basePath + "/" + table + p.toQueryString());
}

// ─────────────────────────────────────────────
// patient_records
// ─────────────────────────────────────────────
DbResult<json> SupabaseClient::getPendingQueue() {
    auto p = QueryParams{}
        .withFilter("status=eq.pending")
        .withOrder("created_at.desc")
        .withSelect("*");
    return doGet(m_basePath + "/patient_records" + p.toQueryString());
}

DbResult<json> SupabaseClient::getAllRecords(int limit) {
    auto p = QueryParams{}
        .withSelect("*")
        .withOrder("created_at.desc")
        .withLimit(limit);
    return doGet(m_basePath + "/patient_records" + p.toQueryString());
}

DbResult<json> SupabaseClient::getRecordById(const std::string& id) {
    auto p = QueryParams{}
        .withFilter("id=eq." + id)
        .withSelect("*");
    return doGet(m_basePath + "/patient_records" + p.toQueryString());
}

DbResult<json> SupabaseClient::getRecordsByDoctor(const std::string& doctorId) {
    auto p = QueryParams{}
        .withFilter("doctor_id=eq." + doctorId)
        .withSelect("*")
        .withOrder("created_at.desc");
    return doGet(m_basePath + "/patient_records" + p.toQueryString());
}

DbResult<json> SupabaseClient::getRecordsByPatient(const std::string& patientName,
                                                    const std::string& phone) {
    // Ưu tiên phone nếu có (chính xác hơn)
    std::string filter;
    if (!phone.empty())
        filter = "phone=eq." + phone;
    else
        filter = "patient_name=ilike.*" + patientName + "*";

    auto p = QueryParams{}
        .withFilter(filter)
        .withSelect("*")
        .withOrder("created_at.desc");
    return doGet(m_basePath + "/patient_records" + p.toQueryString());
}

DbResult<json> SupabaseClient::insertRecord(const json& body) {
    return doPost(m_basePath + "/patient_records", body);
}

DbResult<json> SupabaseClient::updateRecord(const std::string& id,
                                             const json& body) {
    auto p = QueryParams{}.withFilter("id=eq." + id);
    return doPatch(m_basePath + "/patient_records" + p.toQueryString(), body);
}

DbResult<void> SupabaseClient::completeRecord(const std::string& id,
                                               const std::string& pharmacyNote) {
    json patch = { {"status", "done"} };
    if (!pharmacyNote.empty())
        patch["pharmacy_note"] = pharmacyNote;

    auto p = QueryParams{}.withFilter("id=eq." + id);
    auto r = doPatch(m_basePath + "/patient_records" + p.toQueryString(), patch);
    if (!r.success) return DbResult<void>::err(r.error, r.httpStatus);
    return DbResult<void>::ok();
}

DbResult<void> SupabaseClient::cancelRecord(const std::string& id) {
    json patch = { {"status", "cancelled"} };
    auto p = QueryParams{}.withFilter("id=eq." + id);
    auto r = doPatch(m_basePath + "/patient_records" + p.toQueryString(), patch);
    if (!r.success) return DbResult<void>::err(r.error, r.httpStatus);
    return DbResult<void>::ok();
}

// ─────────────────────────────────────────────
// users
// ─────────────────────────────────────────────
DbResult<json> SupabaseClient::getUserById(const std::string& id) {
    auto p = QueryParams{}.withFilter("id=eq." + id).withSelect("*");
    return doGet(m_basePath + "/users" + p.toQueryString());
}

DbResult<json> SupabaseClient::getUsersByRole(const std::string& role) {
    auto p = QueryParams{}
        .withFilter("role=eq." + role)
        .withSelect("*")
        .withOrder("name.asc");
    return doGet(m_basePath + "/users" + p.toQueryString());
}

DbResult<json> SupabaseClient::upsertUser(const json& body) {
    // Supabase upsert: POST với header Prefer: resolution=merge-duplicates
    httplib::SSLClient cli(m_host);
    cli.set_connection_timeout(10);
    cli.set_read_timeout(15);

    httplib::Headers h = buildHeaders();
    h.emplace("Prefer", "resolution=merge-duplicates,return=representation");

    auto res = cli.Post(m_basePath + "/users", h,
                        body.dump(), "application/json");
    if (!res)
        return DbResult<json>::err("Network error: no response", 503);
    if (res->status >= 400)
        return DbResult<json>::err(res->body, res->status);

    try {
        return DbResult<json>::ok(json::parse(res->body));
    } catch (...) {
        return DbResult<json>::err("JSON parse error", 500);
    }
}

// ─────────────────────────────────────────────
// expenses
// ─────────────────────────────────────────────
DbResult<json> SupabaseClient::getExpensesByMonth(const std::string& month) {
    auto [start, end] = monthRange(month);
    // filter theo range: dùng 2 params — Supabase hỗ trợ AND tự nhiên
    std::string path = m_basePath + "/expenses"
        "?date=gte." + start +
        "&date=lte." + end +
        "&order=date.asc"
        "&select=*";
    return doGet(path);
}

DbResult<json> SupabaseClient::insertExpense(const json& body) {
    return doPost(m_basePath + "/expenses", body);
}

// ─────────────────────────────────────────────
// inventory
// ─────────────────────────────────────────────
DbResult<json> SupabaseClient::getInventoryByMonth(const std::string& month) {
    auto [start, end] = monthRange(month);
    std::string path = m_basePath + "/inventory"
        "?date=gte." + start +
        "&date=lte." + end +
        "&order=date.asc"
        "&select=*";
    return doGet(path);
}

DbResult<json> SupabaseClient::insertInventory(const json& body) {
    return doPost(m_basePath + "/inventory", body);
}