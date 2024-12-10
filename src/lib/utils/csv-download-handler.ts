import { browser } from '$app/environment';

export function download<T>(json: T[], fileName: string, fieldMapping: Partial<Record<keyof T, string>>) {
    const csv = jsonToCsv(json, fieldMapping);
    const csvFileName = `${fileName}.csv`;
    createDownload(csv, csvFileName);
}

function jsonToCsv<T>(json: T[], fieldMapping: Partial<Record<keyof T, string>>) {
    if (!json || json.length === 0) return;
    const fields = Object.keys(fieldMapping) as (keyof T)[];
    const replacer = (key: string, value: string) => (value === null ? '' : value);
    const header = fields.map((fieldName) => fieldMapping[fieldName] || fieldName).join(',');
    return [
        header,
        ...json.map((row) => fields.map((fieldName) => JSON.stringify(row[fieldName], replacer)).join(',')),
    ].join('\r\n');
}

function createDownload(csv: string | undefined, filename: string) {
    if (!csv || !browser) return;
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}
