import { getFromApiWithoutBlocking } from '$lib/utils/http-service';
import type { Bible } from '$lib/types/base';
import type { LayoutLoad } from './$types';

export const load: LayoutLoad = async ({ parent }) => {
    const { languages } = await parent();

    const englishLanguageId = languages?.find((l) => l.iso6393Code === 'eng')?.id;

    return {
        bibles: getFromApiWithoutBlocking<Bible[]>(`/bibles/language/${englishLanguageId}`, fetch),
    };
};
