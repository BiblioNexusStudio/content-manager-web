import { unzip } from 'unzipit';
import { asyncMap } from './array';

interface ObjectUrlMapping {
    url?: string | null;
    file: string;
}

export async function readFilesIntoObjectUrlsMapping<T extends ObjectUrlMapping>(zipUrl: string, mapping: T[]) {
    const { entries } = await unzip(zipUrl);
    const fileAndBlob = await asyncMap(Object.entries(entries), async ([key, value]) => [key, await value.blob()]);
    const blobsByFile = Object.fromEntries(fileAndBlob);
    return mapping.map((map) => {
        const fileSplit = map.file.split('.');
        const extension = fileSplit[fileSplit.length - 1];
        return {
            ...map,
            url: blobsByFile[map.file]
                ? URL.createObjectURL(new Blob([blobsByFile[map.file]], { type: 'audio/' + extension }))
                : null,
        };
    });
}
