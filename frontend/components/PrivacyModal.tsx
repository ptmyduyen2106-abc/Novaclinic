// ─────────────────────────────────────────────
// components/PrivacyModal.tsx — Modal chính sách bảo mật
// ─────────────────────────────────────────────

'use client'

import { useEffect } from 'react'

interface PrivacyModalProps {
  open: boolean
  onClose: () => void
}

export function PrivacyModal({ open, onClose }: PrivacyModalProps) {
  // Đóng modal bằng phím Esc
  useEffect(() => {
    if (!open) return
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          <h2 className="text-lg font-bold text-gray-900">Chính sách bảo mật NovaClinic</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition"
            aria-label="Đóng"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 overflow-y-auto text-sm text-gray-700 leading-relaxed space-y-4">
          <p className="text-xs text-gray-400">Cập nhật lần cuối: 20/06/2026</p>

          <p>
            NovaClinic cam kết bảo vệ quyền riêng tư và dữ liệu cá nhân của người dùng.
          </p>

          <section>
            <h3 className="font-semibold text-gray-900 mb-1">1. Thông tin được thu thập</h3>
            <ul className="list-disc pl-5 space-y-0.5">
              <li>Họ và tên</li>
              <li>Địa chỉ email</li>
              <li>Số điện thoại</li>
              <li>Tên đăng nhập</li>
              <li>Địa chỉ IP</li>
              <li>Thông tin thiết bị và nhật ký hoạt động</li>
            </ul>
          </section>

          <section>
            <h3 className="font-semibold text-gray-900 mb-1">2. Mục đích sử dụng thông tin</h3>
            <ul className="list-disc pl-5 space-y-0.5">
              <li>Tạo và quản lý tài khoản.</li>
              <li>Xác thực đăng nhập.</li>
              <li>Cung cấp dịch vụ.</li>
              <li>Hỗ trợ kỹ thuật.</li>
              <li>Cải thiện chất lượng hệ thống.</li>
              <li>Đảm bảo an toàn và bảo mật.</li>
            </ul>
          </section>

          <section>
            <h3 className="font-semibold text-gray-900 mb-1">3. Chia sẻ thông tin</h3>
            <p>NovaClinic không bán hoặc cho thuê thông tin cá nhân của người dùng.</p>
          </section>

          <section>
            <h3 className="font-semibold text-gray-900 mb-1">4. Lưu trữ và bảo mật dữ liệu</h3>
            <p>
              NovaClinic áp dụng các biện pháp kỹ thuật và quản lý phù hợp nhằm bảo vệ dữ
              liệu khỏi truy cập trái phép, thay đổi hoặc rò rỉ thông tin.
            </p>
          </section>

          <section>
            <h3 className="font-semibold text-gray-900 mb-1">5. Cookie và công nghệ theo dõi</h3>
            <p>
              NovaClinic có thể sử dụng cookie để ghi nhớ thông tin đăng nhập và cải thiện
              trải nghiệm người dùng.
            </p>
          </section>

          <section>
            <h3 className="font-semibold text-gray-900 mb-1">6. Quyền của người dùng</h3>
            <ul className="list-disc pl-5 space-y-0.5">
              <li>Truy cập thông tin cá nhân.</li>
              <li>Yêu cầu chỉnh sửa thông tin.</li>
              <li>Yêu cầu xóa tài khoản.</li>
              <li>Khiếu nại về việc xử lý dữ liệu cá nhân.</li>
            </ul>
          </section>

          <section>
            <h3 className="font-semibold text-gray-900 mb-1">7. Thời gian lưu trữ</h3>
            <p>
              Thông tin được lưu trữ trong thời gian cần thiết để cung cấp dịch vụ hoặc
              theo quy định pháp luật.
            </p>
          </section>

          <section>
            <h3 className="font-semibold text-gray-900 mb-1">8. Thay đổi chính sách</h3>
            <p>NovaClinic có thể cập nhật Chính sách bảo mật khi cần thiết.</p>
          </section>

          <section>
            <h3 className="font-semibold text-gray-900 mb-1">9. Liên hệ</h3>
            <p>Email: support@novaclinic.vn</p>
          </section>

          <section className="pt-2 border-t border-gray-100">
            <h3 className="font-semibold text-gray-900 mb-1">Tuyên bố dự án học thuật</h3>
            <p>
              NovaClinic là dự án học tập và nghiên cứu được phát triển bởi nhóm sinh viên
              Trường Đại học Công nghệ Kỹ thuật TP. Hồ Chí Minh. Hệ thống được xây dựng
              nhằm mục đích học thuật, trình diễn công nghệ và không thay thế cho hoạt
              động khám chữa bệnh chuyên nghiệp.
            </p>
          </section>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 shrink-0">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl font-semibold text-white text-sm transition-opacity hover:opacity-90"
            style={{ backgroundColor: '#1B6CA8' }}
          >
            Đã hiểu
          </button>
        </div>
      </div>
    </div>
  )
}