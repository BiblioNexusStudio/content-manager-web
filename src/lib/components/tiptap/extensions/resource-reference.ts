﻿import type { ContentNode, ResourceReference as ResourceReferenceType } from '../types';
import { ResourceReference } from 'aquifer-tiptap';

export default ResourceReference.extend({
    renderHTML(args) {
        // use the aquifer-tiptap ResourceReference renderer and add more to it
        const parentRender = this.parent?.(args);
        if (parentRender && Array.isArray(parentRender) && parentRender[1]) {
            parentRender[1].style = 'color: blue';
            return parentRender;
        }
        throw new Error('Rendering ResourceReference failed.');
    },
});

export const parseResourceReferences = (tiptap: { doc: ContentNode }): ResourceReferenceType[] => {
    const references: ResourceReferenceType[] = [];

    const traverseContent = (node: ContentNode) => {
        if (node.type === 'text' && node.marks) {
            node.marks.forEach((mark) => {
                if (mark.type === ResourceReference.name && mark.attrs?.resourceId && mark.attrs?.resourceType) {
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