# NovaClinic — Hệ thống Quản lý Phòng Khám

> Monorepo gồm **Next.js 14 frontend** + **C++17 backend server** tích hợp **Supabase**  
> Deploy: [novaclinic-six.vercel.app](https://novaclinic-six.vercel.app)

---

##  Mục lục

- [Tổng quan](#tổng-quan)
- [Tech Stack](#tech-stack)
- [Cấu trúc dự án](#cấu-trúc-dự-án)
- [Frontend — Next.js](#frontend--nextjs)
- [Backend — C++](#backend--c)
- [Database — Supabase](#database--supabase)
- [Phân quyền người dùng](#phân-quyền-người-dùng)
- [Hướng dẫn cài đặt & chạy](#hướng-dẫn-cài-đặt--chạy)
- [Biến môi trường](#biến-môi-trường)
- [Triển khai (Deploy)](#triển-khai-deploy)

---

## Tổng quan

**NovaClinic** là hệ thống quản lý phòng khám toàn diện hỗ trợ 4 vai trò người dùng:

| Vai trò | Chức năng chính |
|---|---|
| **Doctor** | Khám bệnh, kê đơn thuốc, lập hồ sơ bệnh nhân |
| **Pharmacist** | Xem hàng chờ realtime, cấp phát thuốc |
| **Admin/Finance** | Dashboard tài chính, quản lý kho, chi phí |
| **Patient** | Đặt lịch hẹn, xem hồ sơ cá nhân |

---

## Tech Stack

| Layer | Công nghệ |
|---|---|
| **Frontend** | Next.js 14 (App Router), TypeScript, Tailwind CSS |
| **Backend** | C++17, cpp-httplib, nlohmann/json |
| **Database** | Supabase (PostgreSQL + Auth + Realtime + RLS) |
| **Deploy Frontend** | Vercel |
| **Deploy Backend** | Render |
| **Build Tool (BE)** | CMake |

---

## Cấu trúc dự án

```
Novaclinic/
├── frontend/               ← Next.js 14 App Router + TypeScript + Tailwind
├── backend/                ← C++17 HTTP server (15 routes)
└── README.md
```

---

## Frontend — Next.js

### Cấu trúc thư mục

```
frontend/
├── app/
│   ├── login/
│   │   └── page.tsx            ← Trang đăng nhập (hỗ trợ 4 role)
│   ├── doctor/
│   │   └── page.tsx            ← Giao diện khám bệnh & kê đơn
│   ├── pharmacy/
│   │   └── page.tsx            ← Hàng chờ nhà thuốc (realtime)
│   ├── finance/
│   │   └── page.tsx            ← Dashboard tài chính
│   ├── dashboard/
│   │   └── page.tsx            ← Trang bệnh nhân (đặt lịch, hồ sơ)
│   ├── page.tsx                ← Root redirect theo role
│   ├── layout.tsx              ← Root layout + AuthProvider
│   └── globals.css             ← Tailwind base + utility classes
│
├── components/
│   ├── NavBar.tsx              ← Navigation thanh công cụ (role-aware)
│   ├── DoctorForm.tsx          ← Form khám bệnh & kê đơn
│   ├── RxBuilder.tsx           ← Công cụ kê đơn thuốc
│   ├── PharmacyQueue.tsx       ← Hàng chờ phát thuốc (live update)
│   ├── QueueCard.tsx           ← Thẻ hiển thị thông tin bệnh nhân
│   ├── FinanceDashboard.tsx    ← Dashboard 4 tab tài chính
│   └── InventoryModal.tsx      ← Modal nhập hàng / quản lý kho
│
├── contexts/
│   └── AuthContext.tsx         ← AuthProvider + useAuth() hook
│
├── hooks/
│   ├── useQueue.ts             ← Realtime subscription hàng chờ
│   └── useFinance.ts           ← Lấy dữ liệu tài chính
│
├── lib/
│   ├── supabase.ts             ← Supabase client + helper functions
│   └── realtime.ts             ← Subscription helpers (Supabase Realtime)
│
├── types/
│   └── index.ts                ← TypeScript types/interfaces toàn cục
│
├── supabase/
│   └── schema.sql              ← DB schema đầy đủ + Row Level Security (RLS)
│
├── middleware.ts               ← Route guard (Edge Runtime) — phân quyền route
├── .env.local.example          ← Mẫu biến môi trường
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

### Tính năng frontend

- **Auth**: Đăng nhập/đăng xuất qua Supabase Auth, tự động redirect theo role
- **Route Guard**: Middleware Edge Runtime bảo vệ từng route theo role
- **Realtime**: Hàng chờ nhà thuốc cập nhật live qua Supabase Realtime
- **Kê đơn**: RxBuilder hỗ trợ thêm/xóa thuốc, lưu JSONB vào `patient_records`
- **Dashboard tài chính**: 4 tab — Thu nhập, Chi phí, Kho hàng, Báo cáo tổng hợp

---

## Backend — C++

### Cấu trúc thư mục

```
backend/
├── src/
│   ├── main.cpp                    ← Entry point, khởi tạo server port 8080
│   ├── models/
│   │   ├── User.h / User.cpp       ← Model người dùng cơ sở
│   │   ├── Doctor.h / Doctor.cpp   ← Model bác sĩ (kế thừa User)
│   │   ├── Pharmacist.h            ← Model dược sĩ
│   │   ├── Admin.h                 ← Model quản trị viên
│   │   └── PatientRecord.h         ← Model hồ sơ bệnh nhân
│   ├── api/
│   │   ├── SupabaseClient.h/.cpp   ← HTTP client gọi Supabase REST API
│   │   └── HttpServer.h/.cpp       ← Định nghĩa 15 routes REST API
│   └── utils/
│       ├── AuthManager.h/.cpp      ← Xác thực JWT token
│       └── ApiResponse.h           ← Template ApiResponse<T> chuẩn hóa response
│
├── libs/                           ← Header-only libraries (tải thủ công)
│   ├── httplib.h                   ← cpp-httplib (HTTP server/client)
│   └── json.hpp                    ← nlohmann/json (JSON parse/serialize)
│
├── CMakeLists.txt                  ← CMake build config
├── .env.example                    ← Mẫu biến môi trường backend
└── Makefile                        ← Shortcut build commands
```

### API Routes (15 endpoints)

| Method | Route | Mô tả |
|---|---|---|
| `POST` | `/api/auth/login` | Đăng nhập, trả về JWT |
| `GET` | `/api/patients` | Danh sách bệnh nhân |
| `GET` | `/api/patients/:id` | Chi tiết hồ sơ bệnh nhân |
| `POST` | `/api/patients` | Tạo hồ sơ bệnh nhân mới |
| `GET` | `/api/appointments` | Danh sách lịch hẹn |
| `POST` | `/api/appointments` | Tạo lịch hẹn |
| `PATCH` | `/api/appointments/:id` | Cập nhật trạng thái lịch hẹn |
| `GET` | `/api/queue` | Lấy hàng chờ hiện tại |
| `POST` | `/api/queue` | Thêm vào hàng chờ |
| `PATCH` | `/api/queue/:id` | Cập nhật trạng thái hàng chờ |
| `GET` | `/api/records` | Danh sách hồ sơ khám |
| `POST` | `/api/records` | Lưu hồ sơ khám + đơn thuốc |
| `GET` | `/api/inventory` | Danh sách kho hàng |
| `POST` | `/api/inventory` | Nhập hàng mới |
| `GET` | `/api/finance/summary` | Tổng hợp tài chính |

---

## Database — Supabase

### Các bảng chính

| Bảng | Mô tả |
|---|---|
| `users` | Tài khoản hệ thống + role (`doctor` / `pharma` / `admin` / `patient`) |
| `patients` | Hồ sơ sức khoẻ bệnh nhân (liên kết với `users`) |
| `appointments` | Lịch hẹn khám (FK → `patients.id`) |
| `queue_numbers` | Số thứ tự hàng chờ, trạng thái chờ/đang khám/xong |
| `patient_records` | Hồ sơ khám + toa thuốc lưu dạng JSONB |
| `follow_ups` | Lịch tái khám |
| `expenses` | Chi phí vận hành phòng khám |
| `inventory` | Phiếu nhập hàng, quản lý tồn kho thuốc/vật tư |
| `notifications` | Thông báo nội bộ cho người dùng |

### Row Level Security (RLS)

Schema `supabase/schema.sql` bao gồm đầy đủ RLS policies đảm bảo:
- Bệnh nhân chỉ đọc được dữ liệu của chính mình
- Bác sĩ chỉ truy cập hồ sơ bệnh nhân được phân công
- Dược sĩ chỉ xem hàng chờ cần phát thuốc
- Admin có quyền toàn bộ hệ thống

---

## Phân quyền người dùng

| Route | patient | doctor | pharma | admin |
|---|:---:|:---:|:---:|:---:|
| `/login` | ✅ | ✅ | ✅ | ✅ |
| `/dashboard` | ✅ | ❌ | ❌ | ❌ |
| `/doctor` | ❌ | ✅ | ❌ | ✅ |
| `/pharmacy` | ❌ | ❌ | ✅ | ✅ |
| `/finance` | ❌ | ❌ | ❌ | ✅ |

Kiểm soát truy cập được thực thi ở **2 lớp**:
1. **Middleware** (`middleware.ts`) — Edge Runtime, chạy trước khi render
2. **RLS Supabase** — Database level, bảo vệ dữ liệu trực tiếp

---

## Hướng dẫn cài đặt & chạy

### Yêu cầu hệ thống

- **Node.js** ≥ 18
- **npm** ≥ 9
- **CMake** ≥ 3.20
- **GCC/Clang** hỗ trợ C++17
- Tài khoản **Supabase** (free tier đủ dùng)

---

### 1. Clone repo

```bash
git clone https://github.com/ptmyduyen2106-abc/Novaclinic.git
cd Novaclinic
```

---

### 2. Cài đặt & chạy Frontend

```bash
cd frontend
npm install

# Tạo file biến môi trường
cp .env.local.example .env.local
# → Mở .env.local, điền NEXT_PUBLIC_SUPABASE_URL và NEXT_PUBLIC_SUPABASE_ANON_KEY

npm run dev
# Truy cập: http://localhost:3000
```

**Build production:**

```bash
npm run build
npm start
```

---

### 3. Tải thư viện header-only cho Backend

```bash
cd backend

# Tạo thư mục libs nếu chưa có
mkdir -p libs

# Tải nlohmann/json
curl -L https://github.com/nlohmann/json/releases/download/v3.11.3/json.hpp \
     -o libs/json.hpp

# Tải cpp-httplib
curl -L https://raw.githubusercontent.com/yhirose/cpp-httplib/master/httplib.h \
     -o libs/httplib.h
```

---

### 4. Build & chạy Backend

```bash
cd backend

# Tạo file biến môi trường
cp .env.example .env
# → Điền SUPABASE_URL, SUPABASE_SERVICE_KEY, JWT_SECRET

# Build
cmake -B build -DCMAKE_BUILD_TYPE=Release
cmake --build build --parallel

# Chạy server
./build/bin/clinic_backend
# Server lắng nghe tại: http://localhost:8080
```

---

### 5. Khởi tạo Database

1. Đăng nhập [Supabase Dashboard](https://supabase.com)
2. Tạo project mới
3. Vào **SQL Editor**, paste toàn bộ nội dung file `frontend/supabase/schema.sql`
4. Chạy → Database sẵn sàng với đầy đủ tables + RLS policies

---

## Biến môi trường

### Frontend — `frontend/.env.local`

```env
NEXT_PUBLIC_SUPABASE_URL=https://<your-project-id>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
NEXT_PUBLIC_API_URL=http://localhost:8080
```

> ⚠️ **Quan trọng khi deploy Vercel**: Phải thêm `NEXT_PUBLIC_API_URL` trong Vercel → Settings → Environment Variables. Thiếu biến này sẽ khiến frontend không gọi được backend.

### Backend — `backend/.env`

```env
SUPABASE_URL=https://<your-project-id>.supabase.co
SUPABASE_SERVICE_KEY=<your-service-role-key>
JWT_SECRET=<your-jwt-secret>
PORT=8080
```

> ⚠️ Dùng `service_role` key cho backend (không dùng `anon` key) để bypass RLS khi cần.

---

## Triển khai (Deploy)

### Frontend → Vercel

```bash
# Cài Vercel CLI (nếu chưa có)
npm i -g vercel

cd frontend
vercel --prod
```

Hoặc kết nối GitHub repo trực tiếp trong Vercel Dashboard.

**Checklist trước khi deploy:**
- [ ] Thêm `NEXT_PUBLIC_SUPABASE_URL` vào Vercel Environment Variables
- [ ] Thêm `NEXT_PUBLIC_SUPABASE_ANON_KEY` vào Vercel Environment Variables
- [ ] Thêm `NEXT_PUBLIC_API_URL` trỏ đến backend Render URL

### Backend → Render

1. Kết nối GitHub repo vào [Render](https://render.com)
2. Chọn **Web Service**, root directory: `backend`
3. Build command: `cmake -B build -DCMAKE_BUILD_TYPE=Release && cmake --build build --parallel`
4. Start command: `./build/bin/clinic_backend`
5. Thêm Environment Variables: `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `JWT_SECRET`

> 💡 **Lưu ý cold start**: Render free tier sẽ sleep sau 15 phút không có request. Dùng [UptimeRobot](https://uptimerobot.com) ping mỗi 10 phút để tránh delay.

---

## Ngôn ngữ trong repo

### Phân chia Frontend vs Backend

| Layer | Tỉ lệ | Ngôn ngữ |
|---|---|---|
| **Backend** | ~95.3% | C++ + Makefile + CMake |
| **Frontend** | ~4.7% | TypeScript + PLpgSQL + CSS + JavaScript |

> 💡 Frontend trông nhỏ vì **Tailwind CSS** viết thẳng vào `className` trong JSX — GitHub không đếm được phần styling đó. Nếu dùng CSS thuần thì tỉ lệ frontend sẽ cao hơn nhiều.

### Chi tiết theo ngôn ngữ (GitHub thống kê)

| Ngôn ngữ | Tỉ lệ | Layer | Ghi chú |
|---|---|---|---|
| C++ | 81.4% | Backend | Toàn bộ source `.cpp` + `.h` trong `src/` |
| Makefile | 13.3% | Backend | `Makefile` nhiều rules/targets → nặng byte |
| TypeScript | 3.9% | Frontend | Các file `.tsx`, `.ts` trong `app/`, `components/`, `hooks/`... |
| CMake | 0.6% | Backend | `CMakeLists.txt` |
| PLpgSQL | 0.6% | Frontend | `supabase/schema.sql` — stored procedures/functions |
| CSS | 0.1% | Frontend | `globals.css` (phần lớn styling dùng Tailwind) |
| JavaScript | 0.1% | Frontend | `next.config.js`, các file config |

---

## Đóng góp

Pull request và issue đều được chào đón. Vui lòng:
1. Fork repo
2. Tạo branch mới: `git checkout -b feature/ten-tinh-nang`
3. Commit rõ ràng: `git commit -m "feat: mô tả ngắn"`
4. Mở Pull Request vào branch `main`

---

<div align="center">
  <sub>Được xây dựng với ❤️ · HCM-UTE · 2025–2026</sub>
</div>
