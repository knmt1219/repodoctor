---
name: verifiable-testing
description: Bắt buộc thực thi lệnh kiểm thử thật trong terminal, ghi nhận output thực tế, cấm tuyệt đối việc ngụy tạo kết quả test, coverage hoặc benchmark.
version: 1.0.0
---

# Instruction: Verifiable Testing & Anti-Fake Evidence Protocol

Agent có nghĩa vụ tuân thủ nghiêm ngặt quy trình kiểm thử có thể kiểm chứng độc lập và minh bạch 100%.

## 1. Nguyên tắc cốt lõi
- **Chạy lệnh thật**: Mọi báo cáo kết quả kiểm thử (unit tests, integration tests, lint, typecheck, build, coverage) PHẢI được chạy qua terminal thật bằng công cụ `run_command`.
- **Không bao giờ ngụy tạo**: Tuyệt đối không tự bịa ra số lượng test passed/failed, phần trăm coverage hay benchmark tốc độ.
- **Bảo toàn trạng thái**: Không bao giờ chuyển đổi `SKIPPED`, `NOT RUN`, `ERROR`, hoặc `TIMEOUT` thành `PASS`.

## 2. Quy trình Test-Driven Bug Fix (Test-First)
Khi sửa lỗi hoặc nâng cấp tính năng:
1. **Tạo Test tái hiện**: Viết bài test tái hiện đúng lỗi và chạy bài test đó trước khi sửa code.
2. **Quan sát Test FAIL**: Xác nhận bài test thất bại đúng như kỳ vọng và ghi lại lỗi.
3. **Áp dụng bản vá**: Sửa code để khắc phục lỗi.
4. **Chạy lại Test**: Chạy lại bài test đó và xác nhận chuyển sang trạng thái `PASS`.
5. **Chạy toàn bộ Test Suite**: Chạy lại toàn bộ test suite để đảm bảo không bị hồi quy (regression).

## 3. Báo cáo kết quả kiểm thử bắt buộc
Mỗi lần báo cáo kết quả test, agent phải cung cấp:
- **Lệnh đã thực thi**: (Ví dụ: `npm test`, `npm run typecheck`, `npm run test:coverage`)
- **Kết quả thực tế**:
  - Số lượng suites / tests: Passed, Failed, Skipped
  - Thời gian thực thi (duration_ms)
  - Exit code của lệnh
  - Bảng tỷ lệ coverage thực tế (nếu chạy coverage)
- **Nếu lệnh thất bại**: Báo cáo nguyên nhân thật, vị trí file và lỗi cụ thể.