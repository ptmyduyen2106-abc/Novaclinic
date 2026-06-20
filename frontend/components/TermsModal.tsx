// ─────────────────────────────────────────────
// components/TermsModal.tsx — Modal điều khoản sử dụng
// ─────────────────────────────────────────────

'use client'

import { useEffect } from 'react'

interface TermsModalProps {
  open: boolean
  onClose: () => void
}

export function TermsModal({ open, onClose }: TermsModalProps) {
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
          <h2 className="text-lg font-bold text-gray-900">Điều khoản sử dụng NovaClinic</h2>
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
            Chào mừng người dùng đến với NovaClinic. Việc truy cập và sử dụng hệ thống
            NovaClinic đồng nghĩa với việc người dùng đã đọc, hiểu và đồng ý tuân thủ các
            điều khoản dưới đây.
          </p>

          <section>
            <h3 className="font-semibold text-gray-900 mb-1">1. Phạm vi áp dụng</h3>
            <p>
              Điều khoản này áp dụng cho mọi cá nhân và tổ chức truy cập hoặc sử dụng
              website, ứng dụng và các dịch vụ do NovaClinic cung cấp.
            </p>
          </section>

          <section>
            <h3 className="font-semibold text-gray-900 mb-1">2. Đăng ký tài khoản</h3>
            <p className="mb-1">Người dùng cam kết:</p>
            <ul className="list-disc pl-5 space-y-0.5">
              <li>Cung cấp thông tin chính xác và đầy đủ khi đăng ký.</li>
              <li>Chịu trách nhiệm bảo mật thông tin đăng nhập.</li>
              <li>Không chia sẻ tài khoản cho người khác sử dụng.</li>
              <li>Thông báo ngay cho NovaClinic khi phát hiện truy cập trái phép vào tài khoản.</li>
            </ul>
            <p className="mt-1">
              NovaClinic có quyền từ chối hoặc khóa tài khoản nếu phát hiện thông tin giả
              mạo hoặc hành vi vi phạm.
            </p>
          </section>

          <section>
            <h3 className="font-semibold text-gray-900 mb-1">3. Quyền và nghĩa vụ của người dùng</h3>
            <p className="mb-1">Người dùng được quyền:</p>
            <ul className="list-disc pl-5 space-y-0.5 mb-2">
              <li>Truy cập các chức năng được hệ thống cung cấp.</li>
              <li>Quản lý và cập nhật thông tin cá nhân.</li>
              <li>Gửi phản hồi hoặc yêu cầu hỗ trợ kỹ thuật.</li>
            </ul>
            <p className="mb-1">Người dùng có trách nhiệm:</p>
            <ul className="list-disc pl-5 space-y-0.5">
              <li>Tuân thủ pháp luật Việt Nam.</li>
              <li>Không sử dụng hệ thống vào mục đích trái pháp luật.</li>
              <li>Không phát tán mã độc, thư rác hoặc nội dung gây hại.</li>
              <li>Không can thiệp trái phép vào cơ sở dữ liệu hoặc hoạt động của hệ thống.</li>
            </ul>
          </section>

          <section>
            <h3 className="font-semibold text-gray-900 mb-1">4. Quyền của NovaClinic</h3>
            <p>
              NovaClinic có quyền cập nhật, sửa đổi hoặc nâng cấp hệ thống; tạm ngừng dịch
              vụ để bảo trì; từ chối hoặc chấm dứt quyền truy cập của người dùng vi phạm
              điều khoản.
            </p>
          </section>

          <section>
            <h3 className="font-semibold text-gray-900 mb-1">5. Quyền sở hữu trí tuệ</h3>
            <p>
              Toàn bộ nội dung, giao diện, hình ảnh, biểu tượng, mã nguồn và các tài sản số
              thuộc NovaClinic được bảo hộ theo quy định pháp luật.
            </p>
          </section>

          <section>
            <h3 className="font-semibold text-gray-900 mb-1">6. Giới hạn trách nhiệm</h3>
            <p>
              NovaClinic nỗ lực đảm bảo hệ thống hoạt động ổn định và chính xác, tuy nhiên
              không chịu trách nhiệm đối với các sự cố do đường truyền Internet, thiết bị
              người dùng hoặc các sự kiện bất khả kháng.
            </p>
          </section>

          <section>
            <h3 className="font-semibold text-gray-900 mb-1">7. Thay đổi điều khoản</h3>
            <p>
              NovaClinic có quyền cập nhật Điều khoản sử dụng bất kỳ lúc nào. Các thay đổi
              sẽ được công bố trên hệ thống.
            </p>
          </section>

          <section>
            <h3 className="font-semibold text-gray-900 mb-1">8. Liên hệ</h3>
            <p>Email: support@novaclinic.vn</p>
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