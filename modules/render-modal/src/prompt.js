// Only generic composition belongs in the remote. Product policy comes from the host.
export function buildRenderPrompt({ systemPrompt = '', prompt = '', scenePrompt = '', contextPrompt = '', scene, aspectRatio, cameraMetadata = {} }) {
    return [
        systemPrompt.trim(),
        scenePrompt.trim(),
        scene?.prompt?.trim(),
        contextPrompt.trim(),
        aspectRatio ? `OUTPUT ASPECT RATIO: ${aspectRatio} (width:height).` : '',
        Object.keys(cameraMetadata).length ? `Camera metadata: ${JSON.stringify(cameraMetadata)}.` : '',
        prompt.trim()
    ].filter(Boolean).join('\n\n');
}
