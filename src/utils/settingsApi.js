export function settingsHeaders() {
    const token = sessionStorage.getItem('aardwolf-admin-token');
    return { 'Content-Type': 'application/json', 'X-Settings-Client': 'configurator', ...(token ? { Authorization: `Bearer ${token}` } : {}) };
}
export async function getSettings() {
    const response = await fetch('/api/settings');
    if (!response.ok) throw new Error('Could not load settings');
    return response.json();
}
export async function putSettings(settings) {
    if (settings.version === 2) {
        const backend = await getSettings();
        if (backend.supportedSchemaVersion !== 2) throw new Error('Update the settings backend to schema v2 before saving shared materials and assembly positions.');
    }
    const response = await fetch('/api/settings', { method: 'PUT', headers: settingsHeaders(), body: JSON.stringify(settings) });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Could not save settings');
    if (settings.version === 2 && result.version !== 2) throw new Error('The backend did not confirm schema v2.');
    return result;
}
