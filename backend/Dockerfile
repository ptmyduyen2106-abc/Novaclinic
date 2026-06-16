# ==========================================
# STAGE 1: BUILD (Biên dịch mã nguồn C++)
# ==========================================
FROM ubuntu:22.04 AS builder

# Tắt các prompt hỏi đáp trong quá trình cài đặt apt-get
ENV DEBIAN_FRONTEND=noninteractive

# Cài đặt các công cụ build và các thư viện cần thiết
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

# Copy thư mục libs (chứa json.hpp) để tránh lỗi missing file
COPY libs/ ./libs/

# Copy toàn bộ mã nguồn
COPY src/ ./src/

# Tạo thư mục build, tiến hành biên dịch, sau đó tự động tìm và xuất file ra ngoài
RUN mkdir build && cd build && \
    cmake .. && \
    make && \
    find /app/build -type f -name "clinic_backend" -exec cp {} /app/clinic_backend_ready \;

# ==========================================
# STAGE 2: RUN (Môi trường chạy ứng dụng nhẹ)
# ==========================================
FROM ubuntu:22.04

# Cài đặt các thư viện runtime cơ bản
RUN apt-get update && apt-get install -y \
    ca-certificates \
    libssl3 \
    libcurl4 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY .env ./

# Lấy file thực thi đã được tóm gọn từ Stage 1 sang
COPY --from=builder /app/clinic_backend_ready ./clinic_backend

# Cấp quyền thực thi để đảm bảo file chạy được trơn tru
RUN chmod +x ./clinic_backend

# Mở port mà server C++ (httplib) của bạn đang lắng nghe
EXPOSE 8080

# Lệnh khởi chạy backend
CMD ["./clinic_backend"]