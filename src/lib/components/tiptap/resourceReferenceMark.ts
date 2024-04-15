import { Mark } from '@tiptap/core';

export const resourceReferenceMark = Mark.create({
    name: 'resourceReference',
    priority: 1001,
    keepOnSplit: false,
    addAttributes() {
        return {
            resourceId: {
                default: null,
            },
            resourceType: {
                default: null,
            },
        };
    },
    parseHTML() {
        return [
            {
                tag: 'span',
                getAttrs: (node) => {
                    const bnType = (node as HTMLElement).getAttribute('data-bnType');
                    if (bnType === 'resourceReference') {
                        return {
                            resourceId: (node as HTMLElement).getAttribute('data-resourceId'),
                            resourceType: (node as HTMLElement).getAttribute('data-resourceType'),
                        };
                    }

                    return false;
                },
            },
        ];
    },
    renderHTML({ HTMLAttributes }) {
        return [
            'span',
            {
                'data-bnType': 'resourceReference',
                'data-resourceId': HTMLAttributes.resourceId,
                'data-resourceType': HTMLAttributes.resourceType,
                style: 'color: blue',
            },
            0,
        ];
    },
});
