# Project Memory & Context State

## 1. Tóm tắt dự án & Stack kỹ thuật
- **Tên dự án**: RepoDoctor
- **Phiên bản**: v0.1.4
- **Mô tả**: Fast, zero-config Repository Health, Security & CI Linter for modern open-source projects.
- **Tech stack**: Node.js >= 18, TypeScript, Node.js native test runner (`node:test`), Commander.js, fast-glob, YAML parsers.
- **Repository URL**: https://github.com/knmt1219/repodoctor

## 2. Trạng thái hiện tại (Current State)
- **Các tính năng đã hoàn thành**:
  - Đầy đủ **31 built-in production rules** (Security: 6, OSS: 9, CI: 5, Package: 4, Git: 5, Docker: 2).
  - Thêm mới `oss-009` (Missing CODEOWNERS) và `ci-005` (Missing Dependabot / Renovate automated dependency updates).
  - 10 Auto-fixers an toàn và 100% idempotent với chế độ `--dry-run` (`repodoctor fix --dry-run`).
  - Multi-format reporting: Terminal ANSI, JSON, Markdown report, compact PR Markdown summary (`--summary` / `--format markdown-pr`), GitHub workflow annotations (`::error::`), và OASIS SARIF v2.1.0 cho GitHub Security Tab.
  - Tích hợp hệ sinh thái: `action.yml` chuẩn GitHub Marketplace và `.pre-commit-hooks.yaml` cho pre-commit.
  - Tài liệu chuẩn mực: `README.md` định vị chuyên nghiệp, `ROADMAP.md` 3-6 tháng, `CHANGELOG.md` theo Keep a Changelog + SemVer, `SECURITY.md`, và `docs/CODEX-FOR-OSS-NOTES.md` cho hồ sơ OpenAI Codex for OSS.
  - 16 test suites với hơn 100 assertions pass 100% bằng native test runner.
  - Self-dogfooding: `repodoctor check . --strict` đạt **100/100 (Grade A+)**.
  - Đã commit và đồng bộ (`git push origin main`) lên GitHub repository.
- **Các task đang dang dở / cần làm tiếp**:
  - Đăng ký GitHub Marketplace và Pre-commit index khi release tag v0.1.4.

## 3. Quyết định kỹ thuật & Quy ước quan trọng
- **Không chạy mã của repo được quét**: Chỉ phân tích tĩnh dưới dạng text/data thuần túy.
- **Zero network calls**: Hoàn toàn offline và air-gapped.
- **Secret Redaction**: Tự động che giấu token/private key trước khi xuất báo cáo.
- **Quy ước sau khi làm xong task**: Luôn in đường dẫn repository GitHub và đồng bộ commit/push lên GitHub.

## 4. Nhật ký công việc gần nhất (Recent Logs)
- [2026-08-20]: Nâng cấp toàn diện RepoDoctor lên v0.1.4, bổ sung `oss-009`, `ci-005`, `--dry-run`, PR summary reporter, `action.yml`, `.pre-commit-hooks.yaml`, `ROADMAP.md`, `docs/CODEX-FOR-OSS-NOTES.md`, verify 100% test pass và push lên `origin/main`.
