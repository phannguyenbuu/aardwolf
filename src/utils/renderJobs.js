export function readRenderJob(data) {
    const job = data.job || data;
    const status = String(job.status || '').toLowerCase();
    const result = job.result_image_url || job.outputs?.find(o => o.type === 'image' && o.url)?.url;
    const failed = ['failed', 'error', 'cancelled', 'canceled'].includes(status);
    const message = job.error || job.current_step || 'Render failed';
    return {
        id: data.job_id || job.id,
        result,
        failed: failed && !result,
        error: /timeout|quá thời gian/i.test(message)
            ? 'Timeout'
            : failed ? `The image service could not complete this job (${message}). Try again.` : '',
        progress: Math.min(99, Math.max(0, Number(job.progress) || 0))
    };
}
