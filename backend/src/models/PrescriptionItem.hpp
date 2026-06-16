#pragma once
#include <string>
#include "../libs/json.hpp"

using json = nlohmann::json;

// ─────────────────────────────────────────────
// PrescriptionItem — một dòng thuốc trong toa
// Maps to JSONB array trong patient_records
// ─────────────────────────────────────────────
struct PrescriptionItem {
    std::string drugName;
    std::string dosage;       // "1v x 2/ngày"
    int         quantity   = 1;
    std::string instruction;  // "Uống sau ăn"
    double      unitPrice  = 0.0;

    // ── Computed ──────────────────────────────
    double lineTotal() const { return quantity * unitPrice; }

    // ── JSON serialization ────────────────────
    json toJson() const {
        return {
            {"drugName",    drugName},
            {"dosage",      dosage},
            {"quantity",    quantity},
            {"instruction", instruction},
            {"unitPrice",   unitPrice},
            {"lineTotal",   lineTotal()}
        };
    }

    // FIX: dùng .value() thay vì .get<>() để xử lý an toàn cả null lẫn key thiếu
    static PrescriptionItem fromJson(const json& j) {
        PrescriptionItem item;
        item.drugName    = j.value("drugName",    "");
        item.dosage      = j.value("dosage",      "");
        item.quantity    = j.value("quantity",    1);
        item.instruction = j.value("instruction", "");
        item.unitPrice   = j.value("unitPrice",   0.0);
        return item;
    }

    // ── Validation ────────────────────────────
    bool isValid() const {
        return !drugName.empty() && quantity > 0 && unitPrice >= 0;
    }

    std::string validationError() const {
        if (drugName.empty())  return "Tên thuốc không được để trống";
        if (quantity <= 0)     return "Số lượng phải lớn hơn 0";
        if (unitPrice < 0)     return "Đơn giá không được âm";
        return "";
    }
};