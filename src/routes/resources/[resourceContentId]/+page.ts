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
                        name: 'Jesse Winston',
                        time: '7:58 PM Mar 3, 2024',
                        comment: 'hello world 1',
                    },
                    {
                        name: 'Jesse Winston',
                        time: '7:58 PM Mar 3, 2024',
                        comment:
                            'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
                    },
                    {
                        name: 'Jesse Winston',
                        time: '7:58 PM Mar 3, 2024',
                        comment:
                            'this is some longer comment about why this word is not appropriate in the part here because of reasons',
                    },
                ],
            },
            {
                threadId: 2,
                comments: [
                    {
                        name: 'Jesse Winston',
                        time: '7:58 PM Mar 3, 2024',
                        comment: 'hello world 2',
                    },
                ],
            },
            {
                threadId: 3,
                comments: [
                    {
                        name: 'Jesse Winston',
                        time: '7:58 PM Mar 3, 2024',
                        comment: 'hello world 3',
                    },
                ],
            },
        ],
    };
};
