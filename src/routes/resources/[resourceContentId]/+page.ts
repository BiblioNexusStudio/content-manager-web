import type { PageLoad } from './$types';
import { getFromApiWithoutBlocking } from '$lib/utils/http-service';
import type { ResourceContent } from '$lib/types/resources';

export const load: PageLoad = async ({ parent, params, fetch }) => {
    await parent();

    return {
        resourceContentId: params.resourceContentId,
        resourceContent: getFromApiWithoutBlocking<ResourceContent>(
            `/resources/content/${params.resourceContentId}`,
            fetch
        ),
        commentThreads: [
            {
                threadId: 1,
                comments: [
                    {
                        comment: 'hello world 1',
                    },
                ],
            },
            {
                threadId: 2,
                comments: [
                    {
                        comment: 'hello world 2',
                    },
                ],
            },
            {
                threadId: 3,
                comments: [
                    {
                        comment: 'hello world 3',
                    },
                ],
            },
        ],
    };
};
