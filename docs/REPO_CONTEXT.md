# Ngữ cảnh và kiến trúc

## Sản phẩm và stack

Ứng dụng Vacuum Tube Lifter Configurator: chọn crane, chiều dài jib, tải trọng WLL, môi trường, bề mặt và kích thước kiện hàng; xem cụm lắp 3D, chỉnh vật liệu/ánh sáng, chuyển sang thông số và xuất báo giá PDF. Đăng nhập dùng để lấy bảng giá.

`package.json`: React 19, Vite 6, Three.js 0.170, Bootstrap 5, pdf-lib, fontkit và downloadjs. Playwright có trong devDependencies; chưa có script test/lint trong manifest.

## Entry point và luồng dữ liệu

```text
index.html -> src/main.jsx -> App.jsx
                              ConfiguratorProvider
                                MainApp
                                  ConfiguratorPage / SpecificationPage
                                  Header, ProgressBar, ThreeViewer,
                                  ViewControls, Footer

TabUserSettings -> setters trong ConfiguratorContext
  -> rules.json + data.js + configuratorHelpers.js
  -> capacityStatus / config3D / currentWorkload / totalPrice
  -> ThreeViewer và SpecificationPage

quote() -> kiểm tra quá tải -> snapshot canvas -> lưu lựa chọn
        -> currentPage = specification
SpecificationPage -> generateQuotationPDF -> PDF tải về
```

Điều hướng dùng state `currentPage`, không qua React Router. `ThreeViewer` vẫn được render ở cấp `MainApp` khi chuyển giữa hai trang.

## State và dữ liệu dẫn xuất

Nguồn state chung: `src/context/ConfiguratorContext.jsx`, truy cập bằng `useConfigurator()`.

| Nhóm | Symbol chính | Ý nghĩa |
| --- | --- | --- |
| Lựa chọn | craneType, jibLength, workLoadLimit | Cấu hình crane và công suất |
| Kiện hàng | actualLoad, surfaceType, environment | actualLoad lưu kg/mm, dù giao diện chọn Inch |
| Tính toán | capacityStatus, config3D, totalPrice, currentWorkload | useMemo gọi helper và dữ liệu |
| Báo giá | quote, requote, backToConfigurator | Chuyển trang, reset và snapshot |
| Vật liệu | componentMaterials, customParams, selectedPart | Vật liệu riêng từng bộ phận |
| Vị trí | basePositions, partOffsets, gizmoEnabled, gizmoMode | Gốc lắp và dịch chuyển từng phần |
| Scene | studioTheme, sceneLights, viewportMode | Theme, ánh sáng và chế độ xem |
| Xuất ảnh | takeSnapshotRef, canvasSnapshot, exportRenderTrigger | Kết nối canvas với báo giá/xuất render |

`setCraneType()` tự điều chỉnh jib qua `validateJibForCrane()`. Effect tự chọn lại suction head khi bề mặt, khối lượng, chiều dài hoặc chiều rộng thay đổi. Sửa logic lựa chọn thủ công cần kiểm tra effect này.

## Quy tắc và model

- `rules.json`: crane/allowedJibs, WLL, bề mặt, suction head và thông số metric.
- `data.js`: chuyển rule WLL thành `WORKLOAD_DATA`, sinh dữ liệu Inch, danh sách crane/head/pad/pump và preload.
- `get3DConfiguration()`: chọn crane theo type/jib; chọn tube theo kích thước; ghép head/pad theo key trong rule; trả `data3D`, `zoomft`, tên PDF.
- `ThreeViewer`: preload `/models/aardwolf_all_part_${item.name}.fbx`, lưu map theo tên rồi clone để lắp scene. Thêm model cần cập nhật cả catalog, preload và file vật lý.
- `extractPoint3()` đọc `p1_...`/`p2_...` từ tên crane. `basePositions` chuyển tọa độ nguồn sang Three.js với Y hướng lên; không đổi tên file tùy tiện.
- PDF dùng SVG riêng tại `/models/svg/`, không tự chuyển FBX thành bản vẽ.

## Lưu trữ và tích hợp

- LocalStorage key chính xác: `AarwolfVacumn`. Provider khôi phục lựa chọn và dữ liệu giá; `saveToLocalStorage()` được gọi tại các action, không phải mọi setter đều tự lưu.
- `login()` POST form tới `https://www.aardwolf.com.au/api/get_price.php`, trường `txtUserName`, `txtPassword`, `_submit_login`; response được đọc qua `user.name` và `price`. Đây là hợp đồng quan sát trong code, chưa gọi API để kiểm chứng.
- `totalPrice` chỉ tính khi có `userName` và `priceList`; helper cộng tube, motor, crane, filter, power, control head và suction pad.
- `generateQuotationPDF()` nạp font Open Sans, logo, SVG và snapshot. Đường dẫn asset bắt đầu bằng `/`; triển khai dưới subpath cần kiểm tra.
- `vite.config.js`: dev port 3000, tự mở trình duyệt; plugin `closeBundle` copy cả `models/` và `assets/` vào `dist/`.

## Phạm vi đã kiểm tra

Đã chạy Semble trên `src`, kiểm tra entry point, context, helper, cấu hình Vite, catalog, các nơi gọi PDF và phần preload/lắp scene. Chưa chạy ứng dụng/build, chưa kiểm chứng API, chưa xác nhận model hiển thị hay nội dung PDF xuất ra.
