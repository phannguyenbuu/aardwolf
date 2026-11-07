# Kế hoạch bake vật liệu và ánh sáng cho thiết bị yếu

## 1. Chẩn đoán màu Path Tracing trước khi bake

Ảnh báo cáo thiếu cả màu sơn và logo. Không dùng ảnh này làm nguồn bake. snapshotScene hiện clone material trực tiếp từ scene; không chuẩn hóa FBX/Phong/Basic sang Standard/Physical. MaterialsTexture của three-gpu-pathtracer hiện lấy roughness mặc định 0 nếu thiếu. Đây là rủi ro đã xác nhận từ code, chưa đủ để kết luận nguyên nhân ảnh xám. Local hiện khởi tạo chưa có model do flow chọn từng bước, nên chưa tái hiện đúng cấu hình ảnh.

Lập cấu hình mẫu có crane sơn vàng/cam, tube logo, cao su và workpiece gỗ. Ghi material theo mesh/group trước và sau snapshot: type, color linear/sRGB, map, UV, vertexColors, metalness, roughness, normalMap và material index. Kiểm tra group và texture của mesh nhiều material. Chuẩn hóa bản sao thành MeshStandardMaterial/Physical với ánh xạ tham số rõ ràng; không sửa vật liệu live. Đảm bảo không snapshot đúng lúc Low thay material tạm. Render một ô màu đơn, sau đó máy mẫu ở denoise 0/30/100%; so sánh raw tracer target và output denoise để tìm chính xác bước mất saturation. Kiểm tra exposure/tone mapping chỉ áp một lần. Chỉ chuyển sang bake khi màu sơn, gỗ, cao su và logo đúng.

## 2. Kiến trúc bake đề xuất

Bake offline bằng Blender Cycles trên workstation/worker. Web máy yếu chỉ tải model và texture đã bake, không path trace hoặc unwrap lúc mở trang. Dùng asset canonical GLB/glTF thay vì lặp lại parse FBX. Xuất scene/material manifest từ cấu hình web để Blender nhận đúng color, maps, material groups, UV, transform và đơn vị. Thiết lập studio ánh sáng riêng có version; không trông chờ FBX tự mang đầy đủ material database sang Blender.

Mỗi asset có UV0 giữ albedo/logo và UV bake riêng không chồng lấn. Giữ logo đọc rõ, atlas có padding và dilation cho mipmaps. Bake albedo riêng, AO riêng và irradiance diffuse direct+indirect không chứa albedo. Base color ở sRGB; AO/lightmap/roughness/normal theo dữ liệu linear/non-color. Denoise trong không gian linear trước khi encode, tránh double gamma và double lighting.

## 3. Hai mức hiển thị

Low tối đa: texture màu đã nhân diffuse lighting/AO dùng MeshBasicMaterial hoặc shader unlit tối giản; không real-time shadow map, SSR hay path tracer. Hợp với studio cố định và vật liệu nhám. Nhược điểm: không đổi đèn tự do, highlight phản xạ không di chuyển theo camera.

Balanced khuyến nghị: baseColor + diffuse irradiance/AO + một environment reflection prefiltered nhỏ cho kim loại. Giữ phản xạ phụ thuộc góc nhìn với shader nhẹ. Không bake specular highlight của một camera vào albedo, vì nó bị dính khi xoay. Không nhân bake với real-time diffuse lighting lần nữa.

## 4. Configurator nhiều component

Bake ánh sáng nội tại/AO theo từng component ở pose chuẩn. Không bake bóng của crane vào tube hoặc head khác rồi dùng lại mọi tổ hợp: bóng đó sẽ sai khi thay vị trí/asset. Bóng tiếp xúc giữa component cần giải pháp nhẹ riêng. Mặt sàn dùng shadow decal/blob hoặc shadow texture theo assembly key; nếu cần chính xác, bake cache cho các tổ hợp phổ biến, tránh bake toàn bộ tích Descartes. Lưu hash asset+material+UV+lighting+transform cho cache. Sửa material/geometry/lighting làm invalid bake tương ứng. Không cố bake mỗi thay đổi kéo gizmo trong browser.

## 5. Tối ưu tài nguyên

PoC bắt đầu atlas 1024 cho part nhỏ, 2048 cho crane/tube có logo; đây là mức thử, điều chỉnh theo pixel density và VRAM đo được. Merge mesh chỉ trong cùng component và material phù hợp, giữ khả năng thay component. LOD cho crane/ống và suction nhiều cốc. KTX2/Basis sau khi kiểm tra màu logo và banding bóng. Ngân sách tham khảo PoC: 30 FPS tại thiết bị yếu chỉ định, cold load dưới 5 giây trên đường truyền đã định, texture GPU dưới 128 MB; chưa phải số đo hay cam kết hiện tại.

## 6. Thứ tự triển khai

P0: sửa và khóa regression màu tracer bằng cấu hình mẫu, raw/denoise screenshot.
P1: PoC một crane + một tube logo + một handle + một suction + workpiece; tạo bridge material/scene manifest và script Cycles bake chạy headless. So sánh Low baked, Balanced và path-traced reference ở 3 góc camera.
P2: runtime loader GLB/atlas/lightmap, cache/manifest/versioning và fallback nếu thiếu bake. Không thay đổi các rule WLL/selection.
P3: mở rộng thư viện, cache shadow sàn theo cấu hình, LOD/KTX2 và đo trên laptop iGPU/Android/iPhone mục tiêu.
P4: regression thay component, logo, unit/transform, mobile context loss, download/render. Chỉ bật mặc định sau kiểm tra hình và hiệu năng thực tế.

Deliverables: material-audit report, scene manifest schema, Blender bake script, asset manifest có hash, GLB+textures cho PoC, runtime loader và bảng so sánh FPS/load/VRAM/hình ảnh. Chưa triển khai bake trong yêu cầu lập kế hoạch này.

Tham khảo: https://docs.blender.org/manual/en/4.4/render/cycles/baking.html ; https://threejs.org/docs/pages/MeshBasicMaterial.html ; https://threejs.org/docs/pages/MeshStandardMaterial.html

# Bổ sung: lựa chọn công cụ và các họ vật liệu — 2026-10-29

Khuyến nghị: Blender Cycles offline + pipeline tự động Python, web chỉ hiển thị GLB/PBR và lightmap. 3ds Max thuận tiện hơn nếu file nguồn là .max dùng V-Ray/Corona/Arnold và cần giữ material nguyên bản; bake tại renderer nguồn rồi xuất maps chuẩn. Không chuyển shader renderer-specific qua FBX và kỳ vọng giống hoàn toàn. WebGL UV baking cần xây dựng ray-generation theo texel, atlas, padding, progressive accumulation, denoise, persist và khôi phục context; tái sử dụng materials dễ hơn nhưng tổng công triển khai/rủi ro cao hơn offline tools. Chọn WebGL ở giai đoạn sau nếu yêu cầu bake trực tiếp mỗi cấu hình trong web là bắt buộc.

| Nhóm | Bake | Giữ runtime | Lưu ý |
| --- | --- | --- | --- |
| Gỗ/sơn/vải/cao su | baseColor, tangent normal, roughness, AO, diffuse irradiance | shader nhẹ; reflection nhỏ nếu cần | Không bake albedo hai lần vào lightmap; giữ logo riêng |
| Da | baseColor, normal lỗ chân lông, roughness/AO | specular/Fresnel nhẹ | Phản xạ bề mặt và sheen phụ thuộc view, không đóng vào màu |
| Kim loại | baseColor của kim loại, metalness, roughness, normal | environment reflection prefiltered | Kim loại nguyên chất không có diffuse như sơn; diffuse lightmap riêng không đủ tạo vẻ kim loại |
| Kim loại sơn | lớp sơn như dielectric, normal/roughness | reflection của sơn; substrate chỉ khi lộ | Không đặt metalness=1 cho toàn bộ sơn |
| Kính | tint, normal, roughness, thickness nếu có | Fresnel/transmission/reflection; opacity fallback ở Low | Không thể bake một ảnh khúc xạ đúng cho mọi camera/nền/tổ hợp; Low chấp nhận xấp xỉ |
| Nhựa trong | tint, roughness, thickness/normal | transmission nhẹ hoặc alpha approximation | Kiểm tra sorting, overdraw và chi phí mobile |

Pipeline:
1. Canonical material manifest theo mesh/material slot, ghi color space, UV, texture transforms và đơn vị. Giữ bản regression mapping mới sửa cho tracer.
2. Xuất asset/scene sang Blender và dựng shader từ manifest; không dựa vào tên material để đoán.
3. UV0 cho PBR, UV bake không chồng lấn cho AO/irradiance. Bake normals từ high-poly sang low-poly bằng cage khi có LOD. Padding theo resolution và mip level.
4. Bake từng component với self-AO/lighting; inter-object shadows và contact ground giải quyết theo assembly cache, không đóng vào asset dùng lại.
5. Baked Low unlit cho vật liệu nhám; Balanced dùng reflection probe và PBR nhẹ cho metal/glass/leather. Giới hạn số vật liệu transparent, không SSR/path tracing realtime trên máy yếu.
6. Xuất GLB + PNG/EXR trung gian, kiểm màu linear trước nén KTX2. Manifest hash geometry/material/UV/lightRig/bakeVersion. Bake worker là offline, không cần trên VPS CPU yếu.
7. PoC 6 mẫu: sơn có logo, kim loại brushed, kính, da, gỗ, cao su. So sánh 3 camera, 2 ánh sáng (bake cố định chỉ hợp một lightRig), vật liệu gốc và web. Đo FPS/VRAM/load trên thiết bị mục tiêu; không hứa identical path tracing với kính/kim loại mọi góc nhìn.

Samples trong modal Path Tracing đã thêm giới hạn 1–3000. Tăng target giữ mẫu đã tính và tiếp tục; giảm target dừng khi đạt. Sample count này là camera-render quality, không phải UV bake samples/resolution. Bake texture có thiết lập riêng theo noise và texel density, không mặc định cần 3000.

Nguồn: https://docs.blender.org/manual/en/4.4/render/cycles/baking.html ; https://help.autodesk.com/cloudhelp/2024/ENU/3DSMax-Rendering/files/GUID-B67A2495-89E4-464A-8913-35C957E950EB.htm ; https://docs-chaos.atlassian.net/wiki/spaces/VMAX/pages/113575503
