# Luật cấu hình & báo giá — Vacuum Tube Lifter Configurator

Tổng hợp từ toàn bộ thư mục `ref/` (đọc ngày 28/10/2026). Khi hai nguồn mâu thuẫn, nguồn **mới hơn** được ưu tiên và ghi chú lại ở mục 8.

## 1. Nguồn tài liệu

| File | Nội dung chính | Ngày |
|---|---|---|
| `request-vacuum_tube_lifter_configurator-20261023.docx` | Yêu cầu mới nhất: quy trình 5 bước, mã crane, 8 mức WLL, luật ghép, admin | 22–23/10 |
| `Yêu cầu phát triển lại app Vacuum Tube Lifter Configurator.docx` | Yêu cầu cũ: 9 mức WLL đề xuất, danh sách vật liệu, layout | 20/10 |
| `1. BANG CHON APP 21 OCT.xlsx` (+ bản `… 1.xlsx`, bản trong `app_vacuum_resource (1).zip`) | Ma trận WLL × crane × handle, mã tube và bơm | 21–22/10 |
| `SUCTION CUP TABLE latest 13-OCT 2.xlsx` (+ bản trong zip) | Tải, bề mặt tối thiểu và vật liệu của từng đầu hút | 13/10 |
| `3d_file_step-20261021-con_thieu.xlsx` | Danh sách đầu hút **còn thiếu file 3D**, tube Ø230/254/305 thiếu model | 21/10 |
| `CONTROL HEAD'S 13 OCT 2.xlsx` | Giá handle (và cost của MHC, ETHV2) | 13/10 |
| `tube price.png`, `pricing Thao/hình ảnh (1).png` | Giá tube | — |
| `pricing Thao/hình ảnh (9).png` | Giá motor | — |
| `pricing Thao/hình ảnh (8).png` | Giá bán đầu hút | — |
| `pricing Thao/hình ảnh (10).png` | Giá bán handle | — |
| `Screenshot …png` | Danh sách file STEP, ảnh 4x/6x bellows, cột vật liệu | 23–26/10 |

## 2. Cấu thành sản phẩm

**1 bộ hoàn chỉnh = Crane + Tube + Bơm (motor) + Handle control + Đầu hút.**

Quy trình chọn (mỗi bước lọc bước sau). Lựa chọn không hợp lệ phải **làm mờ và không cho chọn**. Khi đổi một bước trước, các lựa chọn sau không còn hợp lệ phải bị xoá và báo cho người dùng.

1. Crane type → 2. Jib length → (ra **mã crane**)
3. WLL → (ra **mã tube, bơm, Ø tube**)
4. Load type: bề mặt **Non-porous / Porous** (bắt buộc, chọn 1), vật liệu, cân nặng (≤ WLL), kích thước bề mặt nhỏ nhất R × D (mm)
5. Vacuum head = cặp **Handle + Đầu hút** hợp lệ

## 3. Mã crane (Crane type + Jib length)

| Mã | Crane type | Jib (m) |
|---|---|---|
| FM2_5AJC | Floor-Mounted | 2.5 (articulated) |
| FM3 | Floor-Mounted | 3 |
| FM4 | Floor-Mounted | 4 |
| FM5 | Floor-Mounted | 5 |
| MC2_5AJC | Mobile (pallet jack) | 2.5 (articulated) |
| MBC3 | Mobile (pallet jack) | 3 |
| WMC3 | Wall-Mounted | 3 |
| WMC4 | Wall-Mounted | 4 |
| WMC5 | Wall-Mounted | 5 |

Jib hợp lệ: Floor 2.5/3/4/5 m · Mobile 2.5/3 m · Wall 3/4/5 m.

## 4. WLL → tube, bơm, crane cho phép (8 mức, bản 21–23/10)

✓ = cho phép, — = làm mờ.

| WLL (kg) | Mã tube | Bơm | Ø tube (mm) | FM2.5 | FM3 | FM4 | FM5 | MC2.5 | MBC3 | WMC3 | WMC4 | WMC5 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 30 | SM12 | SM-3KW | 120 | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| 40 | SM14 | SM-3KW | 140 | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| 55 | MD16 | MD-4KW | 160 | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| 65 | MDH18 | MD-4KW | 180 | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| 100 | HS20 | HS-7.5KW | 200 | ✓ | ✓ | ✓ | — | ✓ | ✓ | ✓ | ✓ | ✓ |
| 140 | HS23 | HS-7.5KW | 230 | ✓ | ✓ | ✓ | — | ✓ | ✓ | ✓ | ✓ | — |
| 160 | HS25 | HS-7.5KW | 254 | ✓ | ✓ | ✓ | — | — | — | ✓ | — | — |
| 200 | HS30 | HS-7.5KW | 305 | ✓ | ✓ | ✓ | — | — | — | ✓ | — | — |

## 5. Handle control theo WLL

| WLL (kg) | One-hand (MHC) | Comfort Grip (CF2) | Long Reach (ETHV3) | High Reach (ETHV2) |
|---|---|---|---|---|
| 30 | ✓ | ✓ | — | — |
| 40 | ✓ | ✓ | ✓ | ✓ |
| 55 | ✓ | ✓ | ✓ | ✓ |
| 65 | — | ✓ | ✓ | ✓ |
| 100 | — | ✓ | ✓ | ✓ |
| 140 | — | ✓ | ✓ | ✓ |
| 160 | — | ✓ | ✓ | ✓ |
| 200 | — | ✓ | ✓ | ✓ |

## 6. Đầu hút: tải, bề mặt tối thiểu, vật liệu, giá

- **Non-porous:** kính, đá, thép, nhôm, carton ≥ 4 lớp có dán băng keo, bao có lót nilon.
- **Porous:** carton ≤ 3 lớp không băng keo, bao không lót nilon.

| Đầu hút | Tuỳ chọn | Bề mặt tối thiểu R × D (mm) | Tải non-porous (kg) | Tải porous (kg) | Vật liệu phù hợp | Giá bán ($) | Model 3D |
|---|---|---|---|---|---|---|---|
| 1x Bellows cup | Φ200 | 215 × 215 | 35 | 17.5 | Carton, sheet metal, slab, wood | 226.40 | có |
| 1x Bellows cup | Φ250 | 265 × 265 | 54 | 27 | Carton, sheet metal, slab, wood | 248.10 | có |
| 1x Bellows cup | Φ300 | 315 × 315 | 78 | 39 | Carton, sheet metal, slab, wood | 274.60 | có |
| 2x Bellows cups | Φ100 | 115 × 250 | 17 | 8.5 | Carton, sheet metal, slab, wood | 134.90 | có |
| 2x Bellows cups | Φ125 | 140 × 280 | 27 | 13.5 | Carton, sheet metal, slab, wood | 155.10 | có |
| 2x Bellows cups | Φ200 | 220 × 440 | 70 | 35 | Carton, sheet metal, slab, wood | 367.10 | **thiếu** |
| 2x Bellows cups | Φ250 | 270 × 540 | 80 | 54 | Carton, sheet metal, slab, wood | 410.60 | có |
| 2x Bellows cups | Φ300 | 320 × 640 | 80 | 78 | Carton, sheet metal, slab, wood | 463.50 | **thiếu** |
| 4x Bellows cups | Φ100 | 250 × 250 | 34.5 | 17.25 | Carton, sheet metal, slab, wood | 244.80 | có |
| 4x Bellows cups | Φ125 | 280 × 280 | 54 | 27 | Carton, sheet metal, slab, wood | 285.10 | có |
| 6x Bellows cups | Φ100 | 250 × 360 | 51.75 | 26 | Carton, sheet metal, slab, wood | 339.00 | có (chung 1 file) |
| 6x Bellows cups | Φ125 | 280 × 415 | 80 | 40 | Carton, sheet metal, slab, wood | 399.50 | có (chung 1 file) |
| 1x Oval foam pad | 380 × 220 | 390 × 230 | 59.66 | 29.83 | **Bag**, carton, sheet metal, slab | 378.30 | có |
| 1x Oval foam pad | 300 × 200 | 210 × 210 | 39.71 | 19.85 | **Bag**, carton, sheet metal, slab | 360.40 | có |
| 1x Rectangular pad | 125 × 325 | 140 × 340 | 40 | 25 | Carton, sheet metal, slab, wood | 39.90 | **thiếu** |
| 2x Rectangular pads | 125 × 325 | 300 × 340 | 80 | 50 | Carton, sheet metal, slab, wood | 95.00 | có |
| 4x Rectangular pads in-line | 125 × 325 | 340 × 600 | 80 | 80 | Carton, sheet metal, slab, wood | 175.40 | có |
| 4x Rectangular pads frame | 125 × 325 | 400 × 700 | 150 | 80 | Carton, sheet metal, slab, wood | 188.40 | có |
| Multi-cup matrix | — | 300 × 300 | 50 | 25 | Carton, sheet metal, slab, wood | 578.30 | có |
| 1x Flat cup | dày 15 mm | 250 × 250 | 50 | 25 | Stone, concrete, wood | 37.70 | **thiếu** |
| 1x Flat cup | dày 25 mm | 250 × 250 | 50 | 25 | Stone, concrete, wood | 41.50 | **thiếu** |
| 1x Rectangular flat pad | dày 15 mm | 125 × 500 | 60 | 30 | Stone, concrete, wood | 37.70 | **thiếu** |
| 1x Rectangular flat pad | dày 25 mm | 125 × 500 | 60 | 30 | Stone, concrete, wood | 41.50 | **thiếu** |

**Luật ghép đầu hút** (mục 3 của tài liệu 23/10):
- Vật liệu nằm trong cột "Vật liệu phù hợp".
- Tải của đầu hút theo loại bề mặt (non-porous hoặc porous) ≥ cân nặng vật.
- Bề mặt tối thiểu của đầu hút ≤ kích thước vật (xét cả hai chiều xoay).
- Gợi ý: đầu hút có tải **vừa đủ nhất** xếp lên đầu.
- Không có đầu hút nào đạt (ví dụ WLL 160–200 kg, vì tải lớn nhất trong bảng là 150 kg): hiện "Cần đầu hút theo yêu cầu — liên hệ kỹ sư Aardwolf" và **vẫn cho gửi Request a Quote**.

## 7. Bảng giá & công thức

### 7.1 Giá linh kiện ($)

**Tube** (giá wholesale, dài 2600 mm):

| Ø 100 | Ø 120 | Ø 140 | Ø 160 | Ø 180 | Ø 200 | Ø 250 | Ø 300 (×2500) |
|---|---|---|---|---|---|---|---|
| 338.80 | 327.80 | 376.20 | 356.40 | 468.60 | 837.32 | 1,007.62 | 1,256.00 |

**Motor:**

| 3.3 kW | 4.0 kW | 5.5 kW | 7.5 kW |
|---|---|---|---|
| 2,636.00 | 3,290.00 | 4,202.00 | 4,836.00 |

**Handle** (selling price): MHC 424.00 · CF2 226.00 · ETHV3 371.00 · ETHV2 546.00.
Cost (chỉ có 2 handle): MHC 211.75, ETHV2 273.10.

**Đầu hút:** xem cột "Giá bán" ở mục 6.

**Crane:** **chưa có giá.** Tài liệu ghi "Báo giá sẽ được cập nhật sau… giá chung cho cả bộ Crane Type + Jib Length", nghĩa là mỗi mã crane ở mục 3 có một giá riêng.

### 7.2 Công thức

```
Giá tham khảo = Giá crane (theo mã crane)
              + Giá tube (theo Ø tube của WLL)
              + Giá motor (theo bơm của WLL)
              + Giá handle
              + Giá đầu hút
```

Tài liệu 23/10 ghi: "Giá được tính là tổng của ống (Tube) và bơm" cho phần WLL; crane là giá chung theo mã.

### 7.3 Quy đổi bơm → motor và Ø tube → giá tube (giả định, cần xác nhận)

| Bơm (bảng WLL) | Motor dùng để tính giá | Ghi chú |
|---|---|---|
| SM-3KW | 3.3 kW | Bảng giá không có 3.0 kW; lấy mức gần nhất |
| MD-4KW | 4.0 kW | Khớp |
| HS-7.5KW | 7.5 kW | Khớp |
| — | 5.5 kW | Có giá nhưng không mức WLL nào dùng |

| Ø tube (bảng WLL) | Giá tube dùng | Ghi chú |
|---|---|---|
| 120 / 140 / 160 / 180 / 200 | đúng Ø | Khớp |
| 230 (HS23, 140 kg) | **chưa có** | Bảng giá không có Ø230 |
| 254 (HS25, 160 kg) | Ø250 = 1,007.62 | Lấy mức danh định gần nhất |
| 305 (HS30, 200 kg) | Ø300 × 2500 = 1,256.00 | Lấy mức danh định gần nhất; ống ngắn hơn (2500 mm) |

### 7.4 Phụ kiện chưa có trong `ref`

Filter (zfp120 / zfp300, bắt buộc với môi trường bụi) và thiết bị điện (power_1) đang lấy từ API giá của tài khoản (`/api/login`). `ref` không có giá và cũng không nói rõ có tính vào bộ hay không. Ghi chú trong Excel còn đề xuất "thay tủ điện lớn bằng công tắc 3 pha" và "bỏ remote on/off", đang chờ xác nhận.

## 8. Điểm mâu thuẫn & còn thiếu

1. **Số mức WLL:** tài liệu 20/10 đề xuất 9 mức (30/45/70/80/120/150/200/250/300). Tài liệu 23/10 và mọi bảng Excel chốt **8 mức** (30/40/55/65/100/140/160/200). **Ngày 28/10 đã chuyển app sang 8 mức** (`src/constants/rules.json` → `wllLevels`): mỗi mức có `code` (mã tube), `pump`, `motorKw`, `tubePriceKey`, ma trận `allowedCraneJibs` và `allowedHandles` lấy đúng theo mục 4–5. Cấu hình cũ đã lưu (ví dụ `45kg`) tự chuyển sang mức hợp lệ nhỏ nhất đủ tải.
2. **Requote:** tài liệu 20/10 ghi "tính lại giá"; tài liệu 23/10 ghi "**Reset lại dữ liệu, chuyển về trang ban đầu**".
3. **Bề mặt Non-porous / Porous:** tài liệu 23/10 yêu cầu chọn bắt buộc 1 trong 2 trước khi chọn vật liệu. App đang suy ra bề mặt từ vật liệu.
4. **Vật liệu:** tài liệu 23/10 dùng danh sách Carton box, sheet metal, slab, wood, bag, stone, concrete. App đang dùng danh sách cũ (tyre, crate, drum… là "consultation required").
5. **Giá crane** chưa có: không thể ra tổng giá đầy đủ.
6. **Tube Ø230** (WLL 140) chưa có giá và chưa có model. Ø254 và Ø305 cũng chưa có model (file `con_thieu`).
7. **Model 3D còn thiếu:** 2x Bellows Φ200 và Φ300, 1x Rectangular pad, Flat cup 15/25, Rectangular flat pad 15/25.
8. **Model trùng hình:** 1x Φ200/250/300, 2x Φ100/125, 4x Φ100/125 và Oval 380×220/300×200 dùng chung một hình cho mỗi nhóm, nên đổi kích thước thì không thấy khác.
9. **Oval 300 × 200:** bề mặt tối thiểu ghi 210 × 210, nhỏ hơn chính kích thước pad, cần xác nhận lại.
10. Ảnh giá đầu hút ghi dòng "4x RECTANGULAR PAD 325*125 = 188.40" mà không ghi "frame". Ở đây gán cho **4x Rectangular pads frame**, vì dòng in-line đã có giá riêng.
11. **Đơn vị tiền:** bảng giá dùng ký hiệu "$", không ghi rõ USD hay AUD. App đang hiển thị USD. Giá tube là *wholesale*, còn đầu hút và handle là *selling*, nên tổng giá chỉ mang tính tham khảo.
