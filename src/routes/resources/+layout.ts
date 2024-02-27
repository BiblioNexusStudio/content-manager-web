import { fetchJsonStreamingFromApi } from '$lib/utils/http-service';
import type { Bible } from '$lib/types/base';
import type { LayoutLoad } from './$types';

export const load: LayoutLoad = async ({ fetch, parent }) => {
    const { languages } = await parent();

    const englishLanguageId = languages?.find((l) => l.iso6393Code === 'eng')?.id;

    return {
        bibles: fetchJsonStreamingFromApi<Bible[]>(`/bibles/language/${englishLanguageId}`, {}, fetch),
    };
};
