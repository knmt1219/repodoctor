---
name: print-repo-link
description: Tự động lấy remote URL của Git repo và hiển thị link repository sau khi hoàn thành task.
version: 1.0.0
---

# Instruction: Print Repository Link

Khi người dùng kích hoạt skill này hoặc sau khi hoàn thành toàn bộ công việc được giao trong prompt, hãy thực hiện các bước sau:

1. **Kiểm tra Git Remote:**
   - Chạy lệnh terminal: git config --get remote.origin.url
2. **Xử lý định dạng link:**
   - Nếu URL trả về dạng SSH (git@github.com:username/repo.git), hãy chuyển đổi thành định dạng HTTPS: https://github.com/username/repo.
   - Nếu URL trả về dạng HTTPS (https://github.com/username/repo.git), hãy lược bỏ đuôi .git (nếu có).
3. **Hiển thị kết quả:**
   - Luôn in link ở dòng cuối cùng của câu trả lời theo định dạng:
     > 🔗 **Repository:** [Tên Repo / Link](https://github.com/username/repo)
   - Nếu thư mục hiện tại chưa khởi tạo Git hoặc chưa có remote URL, hãy in thông báo: *"Chưa tìm thấy Git remote origin cho project này."*
