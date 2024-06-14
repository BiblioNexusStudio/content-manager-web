import { getFromApi } from '$lib/utils/http-service';
import { log } from '$lib/logger';

let bibleCache: Bible[] | null = null;

interface Bible {
    id: number;
    name: string;
    languageId: number;
    isLanguageDefault: boolean;
}

export const fetchBibles = async (): Promise<Bible[]> => {
    return await getCachedBibles();
};

export const fetchLanguageDefaultBible = async (languageId: number): Promise<Bible | undefined> => {
    const bibles = await getCachedBibles();
    return bibles?.find((b) => b.languageId === languageId && b.isLanguageDefault);
};

const getCachedBibles = async (): Promise<Bible[]> => {
    if (bibleCache === null) {
        try {
            bibleCache = await getFromApi<Bible[]>('/bibles');
        } catch (error) {
            log.exception(error);
        }
    }

    return bibleCache ?? [];
};
