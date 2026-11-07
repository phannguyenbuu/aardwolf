# GenAI Render Modal

Module Federation container: genaiRenderModal. Exposed module: ./RenderModal, export mount(element, props).

Remote Entry: https://genai.toolxprint.com/render-modal/assets/remoteEntry.js

Full public API docs: https://genai.toolxprint.com/render-modal/docs/

Authoritative docs source: public/docs/README.md. HTML: public/docs/index.html.

No product-specific policies are bundled into the remote. Hosts pass prompt, systemPrompt, scenePrompt, contextPrompt, scenes, branding-related title/file name and camera metadata. Output callbacks: onResult, onProgress, onError. React and styles are isolated in Shadow DOM.

Build from repository root: npm run build:render-modal. Output: modules/render-modal/dist. Publish chunks before remoteEntry and retain old chunks. Public docs are copied through public/docs on each build.

Tests: node --test modules/render-modal/src/prompt.test.js; node work/test-generic-render-modal.mjs (new local build with mocked AI responses); node work/test-render-federation.mjs (deployed remote from host, mocked AI responses). TEST_HOST selects production for the latter.

Aardwolf-specific behavior lives in src/rendering/renderModalConfig.js and its host adapter. Render APIs remain public; settings authorization is unchanged.
