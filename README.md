# 🏥 PhòngKhám — Hệ thống Quản lý Phòng Khám

Monorepo gồm **Next.js frontend** + **C++ backend server** tích hợp Supabase.

```
clinic-app/
├── frontend/    ← Next.js 14 (App Router) + TypeScript + Tailwind
├── backend/     ← C++17 HTTP server (cpp-httplib + nlohmann/json)
└── README.md
```

---

## Frontend — Next.js

```
frontend/
├── app/
│   ├── login/page.tsx          ← Đăng nhập (4 role)
│   ├── doctor/page.tsx         ← Khám bệnh & kê đơn
│   ├── pharmacy/page.tsx       ← Hàng chờ nhà thuốc (realtime)
│   ├── finance/page.tsx        ← Dashboard tài chính
│   ├── page.tsx                ← Root redirect theo role
│   ├── layout.tsx              ← Root layout + AuthProvider
│   └── globals.css             ← Tailwind + utility classes
├── components/
│   ├── NavBar.tsx              ← Navigation role-aware
│   ├── DoctorForm.tsx          ← Form khám + kê đơn
│   ├── RxBuilder.tsx           ← Kê đơn thuốc
│   ├── PharmacyQueue.tsx       ← Hàng chờ live
│   ├── QueueCard.tsx           ← Thẻ bệnh nhân
│   ├── FinanceDashboard.tsx    ← Dashboard 4 tab
│   └── InventoryModal.tsx      ← Modal nhập hàng
├── contexts/AuthContext.tsx    ← useAuth hook
├── hooks/
│   ├── useQueue.ts             ← Realtime queue
│   └── useFinance.ts           ← Finance data
├── lib/
│   ├── supabase.ts             ← Supabase client + helpers
│   └── realtime.ts             ← Subscription helpers
├── types/index.ts              ← TypeScript types
├── supabase/schema.sql         ← DB schema + RLS đầy đủ
└── middleware.ts               ← Route guard (Edge Runtime)
```

### Quick start

```bash
cd frontend
npm install
cp .env.local.example .env.local   # điền SUPABASE_URL + ANON_KEY
npm run dev                         # http://localhost:3000
```

---

## Backend — C++

```
backend/
├── src/
│   ├── main.cpp
│   ├── models/         ← User, Doctor, Pharmacist, Admin, PatientRecord…
│   ├── api/            ← SupabaseClient, HttpServer (15 routes)
│   └── utils/          ← AuthManager (JWT), ApiResponse<T>
├── libs/               ← httplib.h + json.hpp (tải thủ công)
├── CMakeLists.txt
└── .env.example
```

### Tải header-only libs

```bash
cd backend
curl -L https://github.com/nlohmann/json/releases/download/v3.11.3/json.hpp -o libs/json.hpp
curl -L https://raw.githubusercontent.com/yhirose/cpp-httplib/master/httplib.h  -o libs/httplib.h
```

### Build & run

```bash
cd backend
cp .env.example .env          # điền SUPABASE_URL, SERVICE_KEY, JWT_SECRET
cmake -B build -DCMAKE_BUILD_TYPE=Release
cmake --build build --parallel
./build/bin/clinic_backend    # port 8080
```

---

## Phân quyền

| Route         | patient | doctor | pharma | admin |
|---------------|:-------:|:------:|:------:|:-----:|
| `/login`      | ✅      | ✅     | ✅     | ✅    |
| `/doctor`     | ❌      | ✅     | ❌     | ✅    |
| `/pharmacy`   | ❌      | ❌     | ✅     | ✅    |
| `/finance`    | ❌      | ❌     | ❌     | ✅    |
| `/dashboard`  | ✅      | ❌     | ❌     | ❌    |

## Database Tables

| Table | Mô tả |
|-------|-------|
| `users` | Tài khoản + role (doctor/pharma/admin/patient) |
| `patients` | Hồ sơ sức khoẻ bệnh nhân |
| `appointments` | Lịch hẹn khám |
| `queue_numbers` | Số thứ tự hàng chờ |
| `patient_records` | Hồ sơ khám + toa thuốc (JSONB) |
| `follow_ups` | Lịch tái khám |
| `expenses` | Chi phí vận hành |
| `inventory` | Phiếu nhập hàng/thuốc |
| `notifications` | Thông báo người dùng |
