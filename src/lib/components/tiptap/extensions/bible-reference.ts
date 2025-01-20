import { v4 as uuid } from 'uuid';
import type { ContentNode, VerseReference } from '../types';
import { BibleReference } from 'aquifer-tiptap';

export default BibleReference.extend({
    addOptions() {
        return {
            ...this.parent?.(),
            isSourceContentArea: false,
        };
    },
    renderHTML(args) {
        // use the aquifer-tiptap BibleReference renderer and add more to it
        const parentRender = this.parent?.(args);
        if (parentRender && Array.isArray(parentRender) && parentRender[1]) {
            const spanId = `bibleref-${uuid()}`;
            parentRender[1].id = spanId;
            parentRender[1].style = 'color: green;';
            parentRender[1].onClick = `onBibleReferenceClick('${spanId}', ${parentRender[1]['data-verses']}, ${this.options.isSourceContentArea})`;

            return parentRender;
        }
        throw new Error('Rendering BibleReference failed.');
    },
});

export const parseBibleReferences = (tiptap: { doc: ContentNode }): VerseReference[] => {
    const references: VerseReference[] = [];

    const traverseContent = (node: ContentNode) => {
        if (node.type === 'text' && node.marks) {
            node.marks.forEach((mark) => {
                if (mark.type === BibleReference.name && mark.attrs?.verses) {
                    references.push(...mark.attrs.verses);
                }
            });
        }

        if (node.content) {
            node.content.forEach(traverseContent);
        }
    };

    traverseContent(tiptap.doc);
    return references.filter(({ startVerse, endVerse }) => !!startVerse && !!endVerse);
};
