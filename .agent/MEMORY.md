# Project Memory & Context State

## 1. Tóm tắt dự án & Stack kỹ thuật
- **Tên dự án**: RepoDoctor
- **Mô tả**: Fast, zero-config Repository Health, Security & CI Linter for modern open-source projects.
- **Tech stack**: Node.js >= 18, TypeScript, Node.js native test runner (node:test), Commander.js, fast-glob, YAML parsers.
- **Repository URL**: https://github.com/knmt1219/repodoctor

## 2. Trạng thái hiện tại (Current State)
- **Các tính năng đã hoàn thành**:
  - Đầy đủ 29 built-in production rules (Security: 6, OSS: 8, CI: 4, Package: 4, Git: 5, Docker: 2).
  - 8 Auto-fixers hoạt động an toàn và hoàn toàn idempotent.
  - Multi-format reporting: Terminal ANSI, JSON, Markdown, GitHub workflow annotations, và OASIS SARIF v2.1.0 cho GitHub Security Tab.
  - Tính toán Health Score (0-100, Grade A+ đến F) chuẩn hóa động theo các category đang bật.
  - Bảo mật filesystem: writeFileSafe và readFileSafe kiểm tra canonical realpath tránh symlink write-through và path traversal.
  - Quét checkTrackedOnly dùng git ls-files -z an toàn không qua shell.
  - 119 unit tests (pass 100%, độ phủ >91% line coverage).
  - Clean package build và dry-run packaging (75.8 kB).
- **Các task đang dang dở / cần làm tiếp**:
  - Chuẩn bị publish lên npm registry khi được yêu cầu.

## 3. Quyết định kỹ thuật & Quy ước quan trọng
- **Không chạy mã của repo được quét**: Chỉ phân tích tĩnh dưới dạng text/data thuần túy.
- **Zero network calls**: Hoàn toàn offline và air-gapped.
- **Secret Redaction**: Tự động che giấu token/private key trước khi xuất báo cáo.
- **Quy ước sau khi làm xong task**: Luôn in đường dẫn repository GitHub và đồng bộ commit/push lên GitHub.

## 4. Nhật ký công việc gần nhất (Recent Logs)
- [2026-08-20]: Khởi tạo và thiết lập các skills `print-repo-link`, `persistent-memory`, `verifiable-testing` cùng file `.agent/MEMORY.md`.
