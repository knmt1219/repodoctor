---
name: persistent-memory
description: Tự động ghi nhớ toàn bộ tiến độ, kiến trúc, quyết định kỹ thuật và context của dự án vào file MEMORY.md để không cần đọc lại lịch sử chat.
version: 1.0.0
---

# Instruction: Persistent Context & Auto-Memory

Agent có nhiệm vụ tự động duy trì trạng thái ngữ cảnh liên tục giữa các phiên làm việc thông qua file `.agent/MEMORY.md`.

## 1. Khởi động (Session Start)
- Khi bắt đầu một phiên chat hoặc nhận prompt mới, luôn kiểm tra sự tồn tại của file `.agent/MEMORY.md`.
- Đọc file `.agent/MEMORY.md` trong nền để nạp toàn bộ context hiện tại của dự án mà không yêu cầu người dùng giải thích lại.

## 2. Trong quá trình thực thi (Runtime)
- Theo dõi các quyết định quan trọng: thư viện mới cài đặt, cấu trúc thư mục thay đổi, bug đã xử lý, hoặc các lưu ý đặc biệt từ người dùng.

## 3. Kết thúc task (Post-Execution Update)
- Trước khi kết thúc câu trả lời, tự động cập nhật/ghi đè file `.agent/MEMORY.md` theo cấu trúc chuẩn:
  ```markdown
  # Project Memory & Context State

  ## 1. Tóm tắt dự án & Stack kỹ thuật
  - Tên dự án: ...
  - Tech stack: ...

  ## 2. Trạng thái hiện tại (Current State)
  - Các tính năng đã hoàn thành: ...
  - Các task đang dang dở / cần làm tiếp: ...

  ## 3. Quyết định kỹ thuật & Quy ước quan trọng
  - Cổng chạy (Port), ENV, Database schema, Routing rules...

  ## 4. Nhật ký công việc gần nhất (Recent Logs)
  - [Timestamp/Task]: Mô tả ngắn gọn việc vừa làm xong.
  ```