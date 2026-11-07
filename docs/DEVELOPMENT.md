# Tra cứu và kiểm chứng

## Đúng thư mục trước khi chạy

```powershell
Set-Location 'D:\Dropbox\_Documents\_Vlance_2026\Aardwolf'
rtk git status --short
```

Các lệnh công cụ dưới đây có tiền tố `rtk` theo hướng dẫn phiên làm việc. `rtk proxy` chạy công cụ chưa có wrapper chuyên biệt.

## Semble: tìm hành vi trước, xác nhận symbol sau

Giới hạn tìm trong `src` để giảm kết quả từ thư viện cũ `jsm/`. Các truy vấn này đã chạy thành công khi lập tài liệu:

```powershell
rtk proxy semble search "configuration state selection validation compatibility pricing" src -k 7 --max-snippet-lines 16
rtk proxy semble search "FBX model loading assembly positioning materials scene rendering snapshot" src -k 6 --max-snippet-lines 14
rtk proxy semble search "generateQuotationPDF SVG drawing font snapshot specification" src -k 5 --max-snippet-lines 14
```

Đường dẫn trong kết quả tương đối với phạm vi tìm: `context/ConfiguratorContext.jsx` tương ứng `src/context/ConfiguratorContext.jsx`.

```powershell
rtk proxy rg -n 'get3DConfiguration|calculateTotalPrice|checkCapacityStatus' src
rtk proxy rg -n 'takeSnapshotRef|setPdfContent|generateQuotationPDF' src
rtk proxy rg -n 'basePositions|partOffsets|update3DScene|createPBRMaterial' src
rtk proxy semble find-related --help
```

Semble giúp chọn vùng code; đọc định nghĩa, caller và effect dependency trước khi sửa. Để tra tài liệu này sau khi tạo:

```powershell
rtk proxy semble search "where to change model selection pricing and PDF" docs -k 5 --max-snippet-lines 12 --content all
```

## Chạy ứng dụng

Theo script trong `package.json`:

```powershell
rtk npm install
rtk npm run dev
rtk npm run build
rtk npm run preview
```

Chỉ cài dependency khi cần; xem trạng thái lockfile trước và sau cài đặt. Dev dùng port 3000 và tự mở trình duyệt. Build copy cả models/assets nên cần tính đến dung lượng. Các script đã được đọc, chưa được chạy trong lần lập tài liệu này. Manifest chưa có script test/lint; không dùng `npm test` như một bước kiểm chứng có sẵn.

## Quy trình sửa

1. Kiểm tra diff hiện có; không ghi đè tài nguyên hay thay đổi của người khác.
2. Tìm chức năng trong [CODE_MAP](CODE_MAP.md), chạy Semble với mô tả lỗi, xác nhận caller bằng rg.
3. Ghi cách tái hiện, giá trị đầu vào và kết quả mong muốn.
4. Sửa vùng nhỏ nhất đáp ứng yêu cầu; đối chiếu consumer của state/helper vừa đổi.
5. Chạy build nếu thay source/config; kiểm tra hành vi tương ứng trong trình duyệt. Test logic khi cần bảo vệ một lỗi hoặc quy tắc có nhiều nhánh.
6. Đọc diff và cập nhật tài liệu khi đổi luồng, dữ liệu hoặc lệnh chạy.

## Checklist chọn theo thay đổi

| Thay đổi | Kiểm chứng có ý nghĩa |
| --- | --- |
| Crane/jib/model | Floor/mobile/wall, jib được phép, FBX không 404, model đúng |
| WLL/head/kiện hàng | Dưới/trùng/vượt WLL, vượt mức lớn nhất, ngưỡng head, thay bề mặt |
| Đơn vị | Chuyển m/Inch hai chiều, khối lượng/kích thước ổn định, tube/giá không đổi ngoài ý muốn |
| Giá/login | Có/không dữ liệu giá, API thất bại, logout, môi trường clean/dusty |
| Scene | Đổi cấu hình liên tục, vật liệu/theme, gizmo/reset, resize/mobile |
| PDF | Quote/back/requote, snapshot mới nhất, SVG/font/logo, thông số và giá khớp UI |
| Persistence | Reload sau action lưu, key AarwolfVacumn, dữ liệu thiếu hoặc JSON lỗi |
| Build/deploy | dist có FBX/SVG/font/logo, đường dẫn asset chạy ở vị trí deploy thực tế |

```powershell
rtk git diff --check
rtk git diff --stat
rtk git status --short
```

Kiểm tra thêm nội dung file mới vì `git diff` thường không hiển thị file untracked. Khi bàn giao, nêu rõ lệnh đã chạy, kết quả và phần chưa kiểm chứng.
