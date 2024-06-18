import { getFromApi } from '$lib/utils/http-service';
import { log } from '$lib/logger';

interface Bible {
    id: number;
    name: string;
    languageId: number;
    isLanguageDefault: boolean;
}

export const fetchBibles = async (): Promise<Bible[]> => {
    try {
        return (await getFromApi<Bible[]>('/bibles')) ?? [];
    } catch (error) {
        log.exception(error);
        return [];
    }
};

export const fetchLanguageDefaultBible = async (languageId: number): Promise<Bible | undefined> => {
    const bibles = await fetchBibles();
    return (
        bibles?.find((b) => b.languageId === languageId && b.isLanguageDefault) ??
        bibles?.find((b) => b.languageId === 1)
    );
};
