# Capture, Render and Render Realistic

Studio HD > Studio Tools & 4K Export exposes three actions. HDR is chosen in the Render dialog and no longer appears as a main viewport mode. Previously saved hdr-ssr viewport mode is migrated to studio-render on load.

- Capture opens a PNG screenshot of the actual viewport scene with helper lines/sprites hidden.
- Render opens a separate panel with Studio Path Tracing or HDR + SSR, environment selection, exposure/intensity, output preview, loading/progress and Cancel. The HDR percentage represents loading/render/encoding stages; path tracing progress represents accumulated samples. Render uses a separate camera/canvas.
- Render Realistic starts with Studio background by default. Other choices: workshop, factory yard, construction site, showroom, office and home garden. Sending occurs only after pressing Render Realistic in the dialog.

Realistic jobs POST through the authenticated VPS proxy `/api/genai/jobs/edit-full` to `https://genai.toolxprint.com/api/jobs/edit-full`. Both frontend and backend fix target_tab_id to TAB-CED9649EEC6A, engine chatgpt, job_type edit_full, new_chat false, aspect_ratio 16:9. reference_images contains the captured PNG data URL, never a local filesystem path. The backend forwards only whitelisted fields and does not expose upstream credentials or job logs.

After submission the app polls the returned job ID via GET /api/genai/jobs/:id, shows upstream progress, and displays result_image_url or image outputs on completion. Cancel aborts local requests and makes a best-effort POST to the upstream job cancellation route. Completion of an already-started remote generation cannot be guaranteed to stop immediately. A 20-minute polling timeout reports an error without claiming completion.

Verification: frontend build; browser test with mocked job submission/status confirmed a PNG data URL, fixed tab, completed result and HDR dialog, without creating a real AI generation job. The VPS proxy was updated; the frontend remains local dev. No real AI result has been generated as part of this test.
