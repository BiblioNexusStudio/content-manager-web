import { Mark } from '@tiptap/core';
import type { ContentNode, ResourceReference } from './types';

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

export const parseResourceReferences = (tiptap: { doc: ContentNode }): ResourceReference[] => {
    const references: ResourceReference[] = [];

    const traverseContent = (node: ContentNode) => {
        if (node.type === 'text' && node.marks) {
            node.marks.forEach((mark) => {
                if (mark.type === 'resourceReference' && mark.attrs?.resourceId && mark.attrs?.resourceType) {
                    references.push({ resourceId: mark.attrs.resourceId, resourceType: mark.attrs.resourceType });
                }
            });
        }

        if (node.content) {
            node.content.forEach(traverseContent);
        }
    };

    traverseContent(tiptap.doc);
    return references;
};
