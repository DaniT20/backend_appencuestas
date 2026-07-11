export function normalizeVariable(text: string, fallbackId?: string): string {
    let v = (text || fallbackId || 'SIN_NOMBRE')
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .toUpperCase()
        .replace(/[^A-Z0-9_\s]/g, '')
        .replace(/\s+/g, '_')
        .replace(/_+/g, '_')
        .replace(/^_|_$/g, '');

    return v || fallbackId?.toUpperCase() || 'SIN_NOMBRE';
}

export function toCamelCase(text: string): string {
    return (text || '')
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .replace(/[^a-zA-Z0-9\s]/g, '')
        .trim()
        .split(/\s+/)
        .map((w, i) => {
            const lower = w.toLowerCase();
            return i === 0 ? lower : lower.charAt(0).toUpperCase() + lower.slice(1);
        })
        .join('');
}
