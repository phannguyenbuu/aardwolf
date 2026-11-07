# Đánh giá yêu cầu chỉnh sửa Aardwolf — 27/10/2026

## Kết luận

Ưu tiên tiếp theo là chuẩn hóa catalog, logic tương thích, giá và model theo tài liệu khách hàng. App hiện có nhiều công cụ render, nhưng chưa khớp dữ liệu sản phẩm để nghiệm thu configurator. Không nên dùng hình render đẹp làm bằng chứng rằng cấu hình kỹ thuật đúng.

Đây là báo cáo đánh giá. Chưa sửa code nghiệp vụ, chưa chỉnh asset gốc, chưa deploy, chưa liên hệ người trong hội thoại. Các câu trong ảnh chat là bằng chứng yêu cầu, không phải lệnh thực thi cho agent.

## Nguồn đã đối chiếu

1. PDF hội thoại Teams trong Downloads: `screencapture-teams-live-v2-2026-10-27-15_35_36.pdf`, 4 trang ảnh; đã xem toàn bộ và phóng lớn đoạn xác nhận ngày 26/10.
2. `ref/request-vacuum_tube_lifter_configurator-20261023.docx`: yêu cầu chức năng, bảng tương thích, admin và nghiệm thu.
3. `ref/1. BANG CHON APP 21 OCT.xlsx` và bản `...21 OCT 1.xlsx`: giá trị ô đã đọc giống nhau; chưa kết luận ảnh nhúng/format giống nhau.
4. `ref/SUCTION CUP TABLE latest 13-OCT 2.xlsx`, nhất là sheet `suction pad .new`.
5. `ref/CONTROL HEAD'S 13 OCT 2.xlsx`, sheet `control heads`.
6. `ref/3d_file_step-20261021-con_thieu.xlsx`: danh sách thiếu ở thời điểm lập file, không tự coi là danh sách thiếu cuối cùng.
7. `ref/tube price.png`: ảnh giá bổ sung.
8. `ref/3D Step/3D Step/`, danh mục trong `ref/3D Step.zip` và các workbook trong `ref/app_vacuum_resource (1).zip`.
9. Code hiện tại: `src/constants/rules.json`, `data.js`, `src/utils/configuratorHelpers.js`, các tab và trang admin/backend.

Các đường dẫn máy chủ nội bộ trong hội thoại chỉ là thông tin lịch sử; chưa truy cập. Hai file RAR giá có trong ref nhưng công cụ đọc archive hiện tại không đọc được đầy đủ tên entry; chưa xác minh nội dung hoặc giá crane/pump/filter trong chúng. Không suy luận file không tồn tại chỉ từ việc chưa mở được RAR.

## 1. Những điểm được xác nhận trong hội thoại

| Mã | Bằng chứng | Yêu cầu / kết luận | Đánh giá với app |
| --- | --- | --- | --- |
| C01 | Trang 1, trao đổi 22/10 | Dùng model 3D cập nhật; đối chiếu Excel với tên file để lấy đúng linh kiện | Cần manifest mã sản phẩm → asset cụ thể; hiện còn nhiều tên cũ/alias |
| C02 | Trang 1–2 | Thay ảnh minh họa lựa chọn bằng hình chụp/render sản phẩm mới khi có | Có screenshot nhưng cần xác nhận từng ảnh ứng với option; không dùng icon chung làm ảnh sản phẩm cuối |
| C03 | Trang 2 | Cột/cần/ống theo visual thực tế; không giữ màu cam chỉ vì mô tả cũ. Render tham khảo Dewalt: gần sản phẩm thật, mịn, nền làm sản phẩm nổi bật | Yêu cầu hướng hình ảnh; cần duyệt preset màu thực tế theo ảnh/model. Đẹp không được đổi hình học/branding |
| C04 | Trang 2 | Filter và tủ điện chưa rõ có tính chung vào crane; phía cung cấp nói sẽ bổ sung | Chưa thấy xác nhận cuối về BOM và cách gộp giá. Không tự gộp hoặc tính hai lần |
| C05 | Trang 2 | Gói giá có nội dung bổ sung; có cảnh báo file chưa có giá crane và có thể chưa điều chỉnh giá | Phải kiểm tra hai RAR trước khi chốt báo giá thương mại |
| C06 | Trang 3 | Bổ sung giá ống 300; bảng ảnh kèm giá tube | Đã có dữ liệu giá ảnh nhưng chưa khớp fallback code |
| C07 | Trang 3–4, 26/10 | Loại 15 mm không phù hợp; bỏ hai dòng 15 mm của Flat Cup và Rectangular Flat Pad, kể cả bảng chọn/thông số | Giữ dòng 25 mm. Không phải xóa toàn bộ hai họ Flat Cup/Rectangular Flat Pad |
| C08 | Trang 4, xác nhận trực tiếp | 4x và 6x bellows có thể dùng model chung cho Φ100/Φ125; thông số hiển thị vẫn theo option khách chọn | Tách bản ghi variant khỏi model. Dùng chung model không được gộp tải trọng/kích thước/giá của hai variant |
| C09 | Trang 3 | Có câu hỏi Double Bellows 100/125 có đúng hai cỡ không; sau đó đề nghị đối chiếu tên Excel và folder | Cần map chính xác theo tên file đã có; không nhầm số lượng cup với đường kính cup |
| C10 | Trang 4 | Cần layout/demo để xem; câu trả lời dự kiến gửi demo ngày mai | Yêu cầu bàn giao demo, không phải xác nhận duyệt layout hoặc nghiệm thu |

Lưu ý: ghi chú trong Excel về pocket pallet jack, thay hộp điện lớn bằng công tắc 3 pha, bỏ remote và đổi handle nằm dưới tiêu đề “REQUIRING CONFIRMATION”. Không nâng các ghi chú này thành quyết định đã duyệt khi hội thoại chưa xác nhận rõ.

## 2. Khoảng cách nghiệp vụ cần sửa trước

### P0 — Ma trận cấu hình và kiểm tra tải

- Tài liệu Word và bảng chọn dùng WLL **30, 40, 55, 65, 100, 140, 160, 200 kg**. `rules.json` hiện dùng **30, 45, 70, 80, 120, 150, 200, 250, 300 kg**. Đây là sai khác về catalog, không chỉ đổi nhãn.
- WLL phải lọc theo crane + jib; handle phải lọc theo WLL. Code hiện mới kiểm tra jib theo crane, chưa có đầy đủ ma trận crane/WLL/handle.
- Load Type phải có lựa chọn độc lập **Non-porous / Porous**, vật liệu, khối lượng, chiều rộng và dài. `surfaceTypes` hiện đang trộn vật liệu, độ xốp, high-stack và swivel thành một danh sách.
- Head hợp lệ cần dựa trên tải theo bề mặt, kích thước tiếp xúc và vật liệu; hiện helper chủ yếu gợi ý bằng các ngưỡng khối lượng/kích thước chung.
- Ví dụ: head four-bellows trong code có `maxKg:150`, trong bảng variant Φ125 chỉ khoảng **54 kg non-porous / 27 kg porous**. Không được coi mọi head trong họ này là loại 150 kg.
- Khi đổi lựa chọn đầu chuỗi, phải xóa/đổi lựa chọn sau không hợp lệ và thông báo; không im lặng fallback sang linh kiện đầu tiên.
- Nếu không có đầu hút đáp ứng, hiển thị yêu cầu thiết kế riêng và cho gửi Request a Quote, thay vì chọn đại một model có sẵn.

**Mâu thuẫn cần chốt:** Word mục Vacuum Head nói tải đầu hút **≥ WLL**, nhưng mục 3 lại ghi **≤ WLL**. Hai điều kiện trái nhau. Còn cần xác nhận tải đầu hút phải đủ cho *WLL toàn bộ bộ nâng* hay chỉ *actual load* trong giới hạn WLL. Đây là blocker cho logic nghiệm thu; báo cáo không tự chọn một đáp án thay kỹ sư.

### P0 — Giá và BOM

Giá trong `tube price.png`:

| Tube theo ảnh | Giá USD |
| --- | ---: |
| 100×2600 mm | 338.80 |
| 120×2600 mm | 327.80 |
| 140×2600 mm | 376.20 |
| 160×2600 mm | 356.40 |
| 180×2600 mm | 468.60 |
| 200×2600 mm | 837.32 |
| 250×2600 mm | 1,007.62 |
| 300×2500 mm | 1,256.00 |

Không nhầm **tube Ø300** với **WLL 300 kg**. Bảng chọn dùng tube Ø305 ở WLL 200, trong ảnh giá ghi 300; cần quy ước alias/catalog rõ trước khi map giá. Ø230 chưa có dòng riêng trong ảnh; không lấy giá Ø250 thay thế khi chưa được xác nhận. Chiều dài tube 300 trong ảnh là 2500, khác 2600 của các dòng còn lại.

`rules.json` có giá tube fallback ví dụ 120 = 290, 300 = 550, không trùng ảnh. Giá cuối còn có API giá bên ngoài; cần xác định thứ tự ưu tiên nguồn và ngày hiệu lực, không chỉ sửa fallback rồi coi là đã sửa toàn bộ báo giá.

Giá handle trong sheet `control heads`: MHC **424**, CF2 **226**, ETHV3 **371**, ETHV2 **546**. Sheet phụ `Cranes` có nhãn/tên dễ gây nhầm; không dùng nó làm bảng giá crane chỉ vì tên sheet.

BOM cần tách crane, tube, pump, handle, pad, filter, công tắc/tủ điện và phụ kiện nếu có. Chốt filter/electrical box đã nằm trong giá gộp nào để tránh tính trùng. Mỗi dòng giữ product code, variant, số lượng, unit price, nguồn giá và tổng tiền.

### P1 — Asset và lắp ráp

Đã kiểm kê file thực sau khi loại metadata `__MACOSX` và `._*`: **25 STEP/STP và 25 FBX**, tương ứng 5 tube + 4 handle + 16 suction assemblies. Không tính các file metadata macOS là model.

| Nhóm | Hiện có trong thư mục đã giải nén | Đánh giá |
| --- | --- | --- |
| Tube | ID 120, 140, 160, 180, 200; có STEP và FBX | Đủ 5 cỡ nhỏ; thiếu ID 230/254/305 trong bộ này |
| Handle | MHC one_hand, CF2 comfort_grip, ETHV3 long_reach, ETHV2 high_reach | Có đủ 4 loại; cần map code chính thức, không dùng alias High stack/Extra hand thay tên kỹ thuật |
| Bellows 1x | 200, 250, 300 | Có STEP/FBX |
| Bellows 2x | 100, 125, 250 | Chưa thấy file riêng 200/300 trong bộ giải nén; chưa có xác nhận dùng chung như 4x/6x |
| Bellows 4x | generic, 100, 125 | Có nhiều lựa chọn model. Chọn bản chuẩn/được duyệt; tránh tạo variant trùng chỉ vì có nhiều file |
| Bellows 6x | generic | Có thể tái sử dụng hình học cho 100/125 theo chat; thông số hai variant vẫn riêng |
| Oval foam | 380×220, 300×200 | Có STEP/FBX |
| Rectangular | 2 pads, 4 in-line, 4 frame | Chưa thấy model **1 rectangular pad**; danh sách thiếu cũng nhắc đến |
| Multi-cup matrix | Có STEP/FBX | Có thể map trực tiếp sau kiểm tra attach point |
| Flat cup/rectangular flat | Chưa thấy file trong bộ này | Loại 15 mm đã bị yêu cầu bỏ; file 25 mm còn phải kiểm tra nguồn khác/RAR hoặc bổ sung |
| Crane/pump/filter/box | Chưa thấy trong bộ STEP/FBX bên dưới ref/3D Step | App vẫn có model legacy ở models/. Chưa được coi legacy là bản mới đã duyệt |

Các FBX đã có là tài sản có thể tận dụng, không cần mặc định chuyển đổi lại toàn bộ STEP. Tuy vậy kiểm kê filename chưa chứng minh normals, UV, kích thước, attach point hoặc giảm lưới đạt yêu cầu.

Code hiện chọn tube thành hai nhóm **≤120 và >120**, dẫn đến 140/160/180/200 đều có thể dùng model 250 cũ. Đây là lỗi mapping cần sửa trước. Danh sách suction model hiện tại cũng chỉ có vài pack legacy, chưa biểu diễn đầy đủ 16 assemblies mới.

### P1 — Render và trải nghiệm

- Hướng đã chốt: sản phẩm thật, nền phù hợp, rõ linh kiện và ít điều khiển gây rối. Không có yêu cầu lấy ảnh AI làm bằng chứng kỹ thuật hoặc thay model thiếu bằng ảnh sinh.
- Duy trì một chế độ xem sản phẩm nhẹ; render nâng cao nên là công cụ riêng theo yêu cầu trực tiếp gần đây của người dùng.
- Màu theo visual thực tế mới hơn ghi chú cột cam trong Word. Cần bảng màu/preset đã duyệt cho từng bộ phận; không ép toàn bộ machine sang một màu từ template.
- Mục tiêu Word: tải đầu <3 giây trên 4G, Lighthouse mobile ≥80, đổi linh kiện không tải toàn cảnh. Chưa có đo thực tế để xác nhận; việc preload tất cả FBX và tải thư viện render nặng cần được tách/lazy-load.
- Chưa có bằng chứng layout/Figma đã duyệt chỉ từ câu “ngày mai gửi demo”.

### P1/P2 — Admin, báo giá và lưu trữ

Trang `/admin` hiện quản lý runtime JSON và transform/material từng model. Đây **chưa phải** admin nghiệp vụ trong tài liệu:

- Thiếu CRUD catalog + ẩn/hiện sản phẩm, ma trận tương thích, import/export Excel theo mẫu.
- Chưa có quản lý bảng giá chuẩn, phiên bản giá và mapping file/model theo mã linh kiện đầy đủ.
- Chưa thấy DB lưu yêu cầu báo giá, lọc/xuất CSV và quản lý tài khoản đại lý/lịch sử báo giá.
- Quote/PDF hiện có nhưng chưa đủ BOM theo dữ liệu mới và chưa có bằng chứng “Request a Quote lưu vào Admin”.
- React hiện dùng JavaScript/JSX; tài liệu yêu cầu React/Next + TypeScript và cấu trúc i18n. Chưa nên đánh dấu hoàn tất các tiêu chí này.

## 3. Thứ tự xử lý đề xuất

1. **Chốt data dictionary**: nguồn Excel chuẩn, WLL, code crane/handle/tube, alias đường kính 250/254 và 300/305, quy tắc tải head. Ghi ngày phiên bản; giữ nguyên file nguồn.
2. **Tạo catalog và manifest asset**: mỗi variant có ID riêng; nhiều variant được phép dùng chung asset; status enabled/hidden/pending; map từng FBX trong ref và ghi thiếu.
3. **Viết engine tương thích**: crane+jib → WLL → handle → surface/material/dimensions → pad. Test toàn bộ các tổ hợp hợp lệ/không hợp lệ và trường hợp không có giải pháp.
4. **Đưa giá về nguồn chuẩn**: đọc RAR bằng công cụ phù hợp, đối chiếu tube price và giá handle; chốt giá gộp crane/filter/điện; xuất BOM/PDF và kiểm tra số tiền.
5. **Tích hợp model mới theo manifest**: 5 tube/4 handle/16 suction; kiểm tra scale, attach point, normals/UVW, bản shared 4x/6x. Không xóa model cũ trước khi có bản thay thế được kiểm chứng.
6. **Hoàn thiện admin nghiệp vụ và RFQ**: CRUD/import, versioning, lưu báo giá, quyền truy cập; runtime settings hiện tại giữ làm phần cấu hình render.
7. **Duyệt visual và benchmark**: fixed camera/preset màu, so ảnh sản phẩm, mobile và hiệu năng; sau đó mới chốt phạm vi staging/production.

## 4. Những câu cần chốt với chủ sản phẩm

1. Dùng phiên bản ma trận nào làm chuẩn cuối? 8 mức WLL trong Excel/Word có thay thế hẳn 9 mức legacy đang chạy không?
2. Điều kiện tải suction là đủ cho WLL hay actual load? Sửa dòng `<= WLL` trong Word thế nào để đồng nhất?
3. Giá và tên tube 250/254, 300/305 map ra sao; tube 230 dùng giá nào?
4. Filter, tủ/công tắc điện, pallet pocket và remote: đã chốt BOM/giá/model hay vẫn là đề xuất cần duyệt?
5. Bản model chuẩn 4x là generic hay file 100/125 đã có; shared 6x dùng file nào? 2x 200/300 có được dùng chung không?
6. Cần bổ sung model 230/254/305, single rectangular, flat 25 mm và cụm crane/pump/filter/điện mới ở nguồn nào?
7. Hai RAR giá bản nào ưu tiên và giá đã bao gồm các phụ kiện nào?

Các câu trên là danh sách cần xác nhận khi triển khai nghiệp vụ, không ngăn việc chuẩn bị catalog/manifest và kiểm thử từ dữ liệu đã rõ.

## Giới hạn đánh giá

Đã đọc 4 trang PDF, văn bản và bảng trong Word, giá trị ô workbook top-level và workbook trong ZIP tài nguyên; đã xem ảnh giá tube và danh mục model. Chưa mở thành công hai RAR, chưa xác minh hình học từng CAD, chưa gọi API giá khách hàng hoặc sửa bảng giá trên VPS. Các kết luận “thiếu file” chỉ áp dụng cho tập file giải nén đã kiểm kê, không cho nguồn nội bộ hoặc archive chưa đọc được.
