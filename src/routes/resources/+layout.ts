import { getFromApiWithoutBlocking } from '$lib/utils/http-service';
import type { BibleBook } from '$lib/types/base';
import type { LayoutLoad } from './$types';

export const load: LayoutLoad = async () => {
    return {
        bibleBooks: getFromApiWithoutBlocking<BibleBook[]>('/bibles/1/books', fetch),
    };
};
