# GenAI Render Modal — API & tích hợp

Remote Entry: https://genai.toolxprint.com/render-modal/assets/remoteEntry.js

Container: `genaiRenderModal` · Exposed module: `./RenderModal` · Export: `mount`.

Module có React root, CSS và Shadow DOM riêng. Host không cần chia sẻ React hay dùng React; JavaScript thuần có thể gọi API dưới đây. Render AI công khai, không cần Admin token.

## 1. Tích hợp nhanh

```js
const container = await import(
  'https://genai.toolxprint.com/render-modal/assets/remoteEntry.js'
);
await container.init({});
const { mount } = (await container.get('./RenderModal'))();

const host = document.createElement('genai-render-modal');
document.body.append(host);

// canvas là canvas của ứng dụng chủ, có quyền đọc pixel.
const props = {
  mode: 'realistic',
  capture: async () => canvas.toDataURL('image/png'),
  prompt: 'Soft daylight.',
  systemPrompt: 'Preserve the product geometry and logo.',
  scenePrompt: 'Create a product photograph.',
  contextPrompt: 'A clean environment.',
  scenes: [{ id: 'studio', label: 'Studio', image: 'https://example.com/studio.jpg', prompt: 'Soft studio lighting.' }],
  initialSceneId: 'studio',
  downloadFileName: 'product-render.png',
  onResult: result => console.log('Result:', result),
  onProgress: state => console.log('Progress:', state),
  onError: error => console.error(error.message),
  cameraMetadata: {
    position: [0, 2, 4], target: [0, 1, 0],
    fov: 45, aspect: 16 / 9, up: [0, 1, 0]
  },
  apiBase: 'https://genai.toolxprint.com/api',
  onClose: () => modal.unmount()
};
const modal = mount(host, props);
```

## 2. Đầu vào mount(element, props)

`element` là HTMLElement mới, đã thêm vào DOM và chưa có ShadowRoot. Mỗi lần mount dùng một element mới.

| Prop | Kiểu | Bắt buộc / mặc định | Ý nghĩa |
| --- | --- | --- | --- |
| mode | 'realistic' / 'render' / 'capture' | Bắt buộc | AI / renderer của host / chỉ xem ảnh chụp |
| capture | () => Promise<string> | Bắt buộc ở mọi mode | Trả PNG hoặc JPEG data URL; gọi lúc mở và trước khi gửi AI |
| onClose | () => void | Bắt buộc | Host xử lý yêu cầu đóng, thường gọi modal.unmount() |
| render | (options) => Promise<Blob> | Bắt buộc khi mode='render' | Host thực thi renderer và trả ảnh dưới dạng Blob |
| prompt | string | '' | Nội dung ban đầu trong ô prompt, người dùng có thể sửa |
| systemPrompt | string | '' | Quy tắc do host cung cấp; ghép vào chuỗi prompt, không phải system role riêng của API |
| scenePrompt | string | '' | Mô tả bối cảnh chung do host truyền |
| contextPrompt | string | '' | Ngữ cảnh bổ sung tùy nghiệp vụ, ví dụ môi trường sạch/bụi |
| scenes | Array<{ id, label, image, prompt }> | [] | Danh sách scene do host cung cấp. Rỗng thì ẩn picker; không có scene công nghiệp mặc định |
| initialSceneId | string | Scene đầu tiên | Scene được chọn ban đầu; ID không tồn tại sẽ chọn scene đầu |
| aspectRatios | string[] | ['1:1', '3:2', '4:3', '16:9'] | Các tỷ lệ cho phép |
| initialAspectRatio | string | '16:9' | Tỷ lệ ban đầu; nếu không nằm trong danh sách thì chọn mục đầu |
| title | string | Theo mode | Tiêu đề modal |
| renderButtonLabel | string | Render Realistic / Render | Tên nút bắt đầu |
| downloadFileName | string | 'render.png' | Tên file tải xuống; trình duyệt có thể bỏ qua với URL ảnh khác origin |
| promptPlaceholder | string | 'Describe your image…' | Placeholder ô prompt |
| timeHint | string | Hướng dẫn chờ chung | Chuỗi rỗng để ẩn hướng dẫn |
| jobOptions | object | {} | Trường bổ sung cho body API như engine, job_type, new_chat; không được ghi đè prompt, reference_images, aspect_ratio |
| pollIntervalMs | number | 2000 | Khoảng poll, tối thiểu 100ms |
| timeoutMs | number | 1200000 | Giới hạn chờ poll, tối thiểu 1000ms; không phải timeout toàn bộ lượt capture/POST |
| onResult | (result) => void | Tùy chọn | Nhận kết quả AI hoặc renderer host |
| onProgress | ({ progress, busy }) => void | Tùy chọn | progress: number hoặc null; busy: boolean |
| onError | ({ message, name }) => void | Tùy chọn | Lỗi capture/tạo job/poll/render; không gọi khi người dùng Cancel |
| cameraMetadata | object | {} | position, target, up: number[3]; fov, aspect: number. Dữ liệu tham chiếu cho prompt, không thay đổi camera host |
| apiBase | string | https://genai.toolxprint.com/api | API gốc, không có dấu / cuối. Aardwolf dùng proxy /api/genai |
| hideCloseButton | boolean | false | Ẩn nút X trong header của mode render/capture; realistic vẫn có X. Escape và bấm backdrop vẫn yêu cầu đóng |

`portalTarget` do mount quản lý trong Shadow DOM, không truyền từ host.

Giữ callback capture ổn định khi update: thay callback sẽ chạy lại bước lấy ảnh preview. Nếu canvas có ảnh khác domain, cấu hình CORS cho ảnh để tránh canvas bị tainted.

## 3. Đầu ra và vòng đời

```js
// mount trả handle đồng bộ:
const modal = mount(host, props);

// update thay toàn bộ props, không merge. Truyền đầy đủ callback bắt buộc.
modal.update({ ...props, workingEnvironment: 'dusty' });

// Dọn React root, abort yêu cầu client và xóa host element.
modal.unmount();
```

mount không trả Promise ảnh; kết quả được gửi qua onResult. Ảnh cũng hiển thị trong modal với before/after, zoom và nút tải xuống. Host nhận yêu cầu đóng qua onClose().

```js
// AI:
onResult({ mode: 'realistic', url, jobId, aspectRatio, sceneId });
// Renderer host:
onResult({ mode: 'render', url, blob, engine });
// Tiến độ:
onProgress({ progress: 100, busy: false });
// Lỗi:
onError({ message: 'Could not create render job', name: 'Error' });
```

URL của mode render là object URL tạm, bị thu hồi khi render lượt mới hoặc unmount. Giữ Blob từ callback và tự tạo URL riêng nếu cần dùng lâu dài. URL AI do backend trả về, tuổi thọ phụ thuộc dịch vụ lưu ảnh. Lỗi do callback host ném ra được log, không biến job render thành thất bại.

Với mode render, Blob là đầu ra của callback do host cung cấp, module chuyển Blob thành object URL để hiển thị. Host có thể giữ Blob ngay trong callback render nếu cần lưu lại.

```js
const render = async ({ engine, environment, exposure, intensity, signal, onProgress }) => {
  // engine: 'studio' hoặc 'hdr'; environment: 1 hoặc 3.
  // exposure mặc định 1.15; intensity mặc định 2.8.
  // signal: AbortSignal; kiểm tra khi export để hỗ trợ Cancel.
  onProgress(0); // số từ 0 đến 100; null nếu chưa biết tiến độ.
  const blob = await myRenderer.export({ engine, environment, exposure, intensity, signal });
  onProgress(100);
  return blob; // Blob ảnh PNG/JPEG.
};
modal.update({ ...props, mode: 'render', render });
```

Cancel trong UI abort yêu cầu client và gửi POST /jobs/{id}/cancel nếu đã có job ID. Unmount và Escape abort yêu cầu client; không đảm bảo job upstream đã hủy. onClose chỉ là thông báo yêu cầu đóng, host phải gọi unmount để dọn modal.

## 4. Prompt và tách biệt nghiệp vụ

Remote không có thương hiệu, mô tả sản phẩm, quy tắc camera, cảnh công nghiệp, tên file hay môi trường riêng của Aardwolf. Tất cả chính sách sản phẩm do host truyền. systemPrompt chỉ là tên prop; API hiện nhận một chuỗi prompt duy nhất.

Thứ tự ghép, bỏ qua phần rỗng:

```text
systemPrompt
scenePrompt
scenes[selectedSceneId].prompt
contextPrompt
OUTPUT ASPECT RATIO: <ratio> (width:height).
Camera metadata: <JSON>.
prompt (nội dung hiện tại trong ô nhập)
```

Đổi prop prompt bằng update sẽ cập nhật ô nhập. Nếu giữ nguyên giá trị prompt, thao tác rerender của host không xóa nội dung người dùng đang sửa. initialSceneId và initialAspectRatio chỉ dùng lúc mount; muốn reset hoàn toàn lựa chọn hãy unmount và mount element mới. scenes có thể update, nếu scene cũ không còn tồn tại thì chọn scene đầu tiên.

Host Aardwolf giữ riêng policy logo/máy/camera, danh sách scene và ánh xạ môi trường trong src/rendering/renderModalConfig.js. Consumer khác truyền chính sách của mình và không nhận các quy tắc đó. Prop workingEnvironment cũ đã được thay bằng contextPrompt tự do; scene mặc định cũ phải chuyển thành scenes do host truyền.

## 5. Hợp đồng HTTP của mode realistic

Tất cả đường dẫn dưới đây nối vào apiBase. Header: Content-Type: application/json; không gắn Authorization.

| Method | Đường dẫn | Mục đích |
| --- | --- | --- |
| POST | /jobs/edit-full | Tạo job với ảnh tham chiếu |
| GET | /jobs/{id} | Poll trạng thái |
| POST | /jobs/{id}/cancel | Yêu cầu hủy |

```json
{
  "engine": "chatgpt",
  "job_type": "edit_full",
  "prompt": "Prompt được modal tổng hợp...",
  "new_chat": false,
  "reference_images": ["data:image/png;base64,..."],
  "aspect_ratio": "4:3"
}
```

```json
{
  "id": "job-id",
  "status": "running",
  "progress": 25
}
```

```json
{
  "id": "job-id",
  "status": "completed",
  "result_image_url": "https://example.com/result.png"
}
```

Parser cũng nhận job lồng trong `{ "job": {...} }`, ID trong job_id và ảnh trong outputs gồm phần tử `{ "type": "image", "url": "..." }`. Trạng thái thất bại: failed, error, cancelled, canceled. Poll khoảng 2 giây; giới hạn chờ phía client là 20 phút. Lỗi fetch/5xx khi poll được thử lại trong giới hạn này. Lỗi hiển thị trong modal và gửi qua onError.

Nếu dùng API khác domain, API phải cho phép CORS cho origin của host. Remote assets đã có CORS; điều này độc lập với CORS của API. Không truyền secret trong props frontend.

## 6. Build, deploy và kiểm chứng

Source: modules/render-modal trong repo Aardwolf. Build từ repo root:

```sh
npm run build:render-modal
```

Deploy nội dung modules/render-modal/dist vào /render-modal/ trên GenAI. Giữ các chunk hash cũ, cập nhật remoteEntry.js sau khi chunk mới đã có; remoteEntry cần revalidate và MIME JavaScript đúng. Docs nằm trong public/docs nên được giữ qua các lần build.

Host Aardwolf có thể đổi URL bằng biến VITE_RENDER_MODAL_REMOTE rồi restart Vite/rebuild. Adapter host có Retry/Close nếu remote không tải được.

Kiểm chứng đã thực hiện: remote/chunk và ảnh nền thật trên production; mock phản hồi tạo/poll job để kiểm tra data URL, tỷ lệ 4:3, hiển thị kết quả và đóng. Chưa chạy một lượt tạo ảnh AI thực tế trong bài kiểm chứng Module Federation.

## 7. Mobile layout

Remote tự chuyển sang bố cục mobile khi màn hình rộng tối đa 767px hoặc cao tối đa 500px. Điện thoại dọc dùng preview phía trên và điều khiển phía dưới trong một vùng cuộn; landscape thấp dùng hai cột. Nút thao tác có vùng chạm tối thiểu 44px, ô prompt dùng font 16px, hỗ trợ safe-area và chiều cao visualViewport khi bàn phím thay đổi. Mount khóa cuộn trang phía sau, unmount phục hồi overflow.

Đã kiểm tra trình duyệt mô phỏng touch tại 320×568, 390×844, 768×1024 và 844×390 cho realistic/render/capture: không tràn ngang, nhập prompt, truy cập tải ảnh, đóng và phục hồi cuộn. Bàn phím hệ điều hành và safe-area trên thiết bị thật chưa được kiểm tra trực tiếp.
