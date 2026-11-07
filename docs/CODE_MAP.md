# Bản đồ sửa code nhanh

Các đường dẫn trong bảng tính từ gốc repo. Tìm symbol bằng `rg` để lấy dòng hiện tại thay vì phụ thuộc số dòng cố định.

| Muốn sửa | Đọc/sửa trước | Kiểm tra liên quan |
| --- | --- | --- |
| Form chọn crane, jib, WLL, kiện hàng | `src/components/tabs/TabUserSettings.jsx` | setters trong context; rule và helper |
| Crane được phép dùng jib nào | `src/constants/rules.json` | `isJibDisabled`, `validateJibForCrane`, `setCraneType` |
| Tải trọng/thông số sản phẩm | `rules.json`, `src/constants/data.js` | `WORKLOAD_DATA`, UI, giá, tube và PDF |
| Gợi ý đầu hút | `getRecommendedSuctionHead` trong `src/utils/configuratorHelpers.js` | Effect chọn lại head trong context; headKey/padKey |
| Cảnh báo quá tải/đề xuất WLL | `checkCapacityStatus` trong helper | `applySuggestedWll`, `quote`, TabUserSettings |
| Quy đổi metric/imperial | `data.js`, TabUserSettings | actualLoad luôn kg/mm; tên unit là `m` hoặc `Inch` |
| Model nào ứng với lựa chọn | `get3DConfiguration`, catalog trong `data.js` | `ALL_PRELOAD_ITEMS`, FBX thực tế, SVG cho PDF |
| Vị trí lắp, tọa độ lệch | `basePositions` trong context, `update3DScene` trong ThreeViewer | `extractPoint3`, `partOffsets`, transform gizmo |
| Vật liệu và preset | `src/constants/pbrMaterials.js` | `createPBRMaterial`, TabMaterialLib, TabComponentMaterials, applyComponentMaterials |
| Ánh sáng, theme, camera | `src/components/ThreeViewer.jsx` | TabEnvironment, ViewControls, sceneLights và camera state |
| Studio HD, xuất ảnh | TabStudioHD, ThreeViewer | exportRenderTrigger, waveletParams, viewportMode; xác nhận consumer thực tế |
| Đăng nhập và giá | Header, `login` trong context | `calculateTotalPrice`, priceList keys, localStorage |
| Trang thông số/báo giá | `src/pages/SpecificationPage.jsx` | quote(), currentWorkload, totalPrice, canvasSnapshot |
| Nội dung/bản vẽ PDF | `src/utils/pdfGenerator.js` | generateQuotationPDF, SvgDrawCls, models/svg, font/logo |
| Bố cục/mobile | `src/styles/page.css`, `responsive.css` | ConfiguratorPage, ThreeViewer, show3DModal |
| Chạy/build/copy asset | `package.json`, `vite.config.js` | models và assets trong dist |

## React và bản HTML/JS cũ

Entry point React hiện tại là `index.html` nạp `/src/main.jsx`. Bản cũ còn tồn tại trong `index.vanilla.html`, `page2.html`, `page2.vanilla.html`, `assets/js/` và `assets/css/`; `jsm/` chứa các module Three.js cũ. React ThreeViewer import addon qua package `three/examples/jsm`, không qua thư mục `jsm/` gốc.

Khi sửa ứng dụng React, bắt đầu từ `src/`. Nếu lỗi chỉ xuất hiện khi mở trang HTML cũ, lần theo script của trang đó; không giả định sửa React sẽ cập nhật bản cũ. Vite vẫn copy `assets/` khi build.

## Khu vực cần đọc kỹ trước khi sửa

- `ALL_SCENES` được helper truy cập bằng chỉ số: thay thứ tự mảng có thể đổi model của nhiều lựa chọn.
- `getRecommendedSuctionHead` có thứ tự ưu tiên điều kiện và các ngưỡng khối lượng/kích thước cụ thể.
- `checkCapacityStatus` dùng ngưỡng underload 35%; nếu vượt WLL lớn nhất, gợi ý hiện tại vẫn là mức lớn nhất. Kiểm thử trường hợp này khi sửa validation.
- `quote()` có thể đổi WLL và chụp snapshot trong cùng action bất đồng bộ. Kiểm tra state, model và PDF cùng phản ánh lựa chọn mới khi sửa luồng này.
- Một số hàm đổi đơn vị trả chuỗi từ `toFixed`; kiểm tra kiểu dữ liệu trước phép tính.
- ThreeViewer có nhiều effect, ref và tài nguyên WebGL. Sửa lifecycle cần kiểm tra cleanup, tải FBX, StrictMode và thay lựa chọn liên tục.

Các mục trên là điểm chú ý từ source, không phải danh sách lỗi đã tái hiện.

## Tài nguyên tham chiếu

`ref/`, `Vacumn/`, `app_vacuum_resource/` chứa Word/Excel, ảnh và dữ liệu 3D; gốc repo còn có PDF/ZIP. Chưa xác định bản tài liệu nghiệp vụ nào là chuẩn cuối cùng. Khi thay rule/giá theo tài liệu, ghi rõ file và phiên bản đã đối chiếu.
