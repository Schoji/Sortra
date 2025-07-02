export function formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    const value = bytes / Math.pow(k, i);

    if (sizes[i] === 'kB') {
        return `${Math.round(value)} ${sizes[i]}`;
    }

    return `${parseFloat(value.toFixed(2))} ${sizes[i]}`;
}