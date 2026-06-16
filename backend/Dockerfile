# ==========================================
# STAGE 1: BUILD (Biên dịch mã nguồn C++)
# ==========================================
FROM ubuntu:22.04 AS builder

# Tắt các prompt hỏi đáp trong quá trình cài đặt apt-get
ENV DEBIAN_FRONTEND=noninteractive

# Cài đặt các công cụ build (C++, CMake, Make) và các thư viện cần thiết (SSL/Curl cho Supabase)
RUN apt-get update && apt-get install -y \
    build-essential \
    cmake \
    libssl-dev \
    libcurl4-openssl-dev \
    && rm -rf /var/lib/apt/lists/*

# Đặt thư mục làm việc trong container
WORKDIR /app

# Copy các file cấu hình và thư viện header vào trước
COPY CMakeLists.txt ./
COPY httplib.h ./

# Copy toàn bộ mã nguồn
COPY src/ ./src/

# Tạo thư mục build và tiến hành biên dịch
RUN mkdir build && cd build && \
    cmake .. && \
    make

# ==========================================
# STAGE 2: RUN (Môi trường chạy ứng dụng nhẹ)
# ==========================================
FROM ubuntu:22.04

# Cài đặt các thư viện runtime cơ bản (như chứng chỉ bảo mật để gọi API HTTPS của Supabase)
RUN apt-get update && apt-get install -y \
    ca-certificates \
    libssl3 \
    libcurl4 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Khai báo file biến môi trường (nếu có dùng file .env)
# Nếu bạn truyền biến môi trường trực tiếp trên server thì không cần dòng COPY .env này
COPY .env ./

# Lấy file thực thi (.exe/binary) đã được build thành công từ Stage 1 sang
# LƯU Ý: Thay 'clinic_backend' bằng đúng tên file thực thi được định nghĩa trong CMakeLists.txt (mục add_executable)
COPY --from=builder /app/build/clinic_backend ./clinic_backend

# Mở port mà server C++ (httplib) của bạn đang lắng nghe (Ví dụ: 8080)
EXPOSE 8080

# Lệnh khởi chạy backend
CMD ["./clinic_backend"]