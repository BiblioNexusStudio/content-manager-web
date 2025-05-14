import { getFromApi } from '$lib/utils/http-service';
import { log } from '$lib/logger';

export interface BasicBible {
    id: number;
    name: string;
    languageId: number;
    isLanguageDefault: boolean;
    abbreviation: string;
}
const fetchBibles = async (): Promise<BasicBible[]> => {
    try {
        return (await getFromApi<BasicBible[]>('/bibles')) ?? [];
    } catch (error) {
        log.exception(error);
        return [];
    }
};

export const fetchLanguageDefaultBible = async (languageId: number): Promise<BasicBible | undefined> => {
    const bibles = await fetchBibles();
    return (
        bibles?.find((b) => b.languageId === languageId && b.isLanguageDefault) ??
        bibles?.find((b) => b.languageId === 1 && b.isLanguageDefault)
    );
};

export const fetchLanguageBiblesAndEnglishDefault = async (languageId: number) => {
    const bibles = await fetchBibles();
    const filteredBibles = bibles.filter(
        (b) =>
            b.languageId === languageId ||
            (b.languageId === 1 && b.isLanguageDefault) ||
            b.abbreviation === 'ULT' ||
            b.abbreviation === 'UST'
    );
    return filteredBibles;
};
