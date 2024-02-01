import type { PageLoad } from './$types';
import { fetchJsonStreamingFromApi, type StreamedData } from '$lib/utils/http-service';
import type { Bible } from '$lib/types/base';

export const load: PageLoad = async ({ fetch, parent }) => {
    const { languages } = await parent();
    const englishLanguageId = languages?.find((l) => l.iso6393Code === 'eng')?.id;
    const bibles = fetchJsonStreamingFromApi(`/bibles/language/${englishLanguageId}`, {}, fetch) as StreamedData<
        Bible[]
    >;
    return { bibles };
};
