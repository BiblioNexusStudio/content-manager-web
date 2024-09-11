import { Mark } from '@tiptap/core';
import { v4 as uuid } from 'uuid';
import type { ContentNode, VerseReference } from './types';

export const bibleReferenceMark = Mark.create({
    name: 'bibleReference',
    priority: 1001,
    keepOnSplit: false,
    addAttributes() {
        return {
            verses: {
                default: [
                    {
                        startVerse: null,
                        endVerse: null,
                    },
                ],
            },
        };
    },
    parseHTML() {
        return [
            {
                tag: 'span',
                getAttrs: (node) => {
                    const bnType = (node as HTMLElement).getAttribute('data-bnType');
                    if (bnType === 'bibleReference') {
                        return {
                            verses: (
                                JSON.parse((node as HTMLElement).getAttribute('data-verses') ?? '[]') as [
                                    number,
                                    number,
                                ][]
                            ).map(([startVerse, endVerse]) => ({ startVerse, endVerse })),
                        };
                    }

                    return false;
                },
            },
        ];
    },
    renderHTML({ HTMLAttributes }) {
        const spanId = `bibleref-${uuid()}`;
        const verses = (HTMLAttributes.verses as { startVerse: number | string; endVerse: number | string }[]).map(
            ({ startVerse, endVerse }) => [parseInt(startVerse.toString()), parseInt(endVerse.toString())]
        );

        return [
            'span',
            {
                id: spanId,
                'data-bnType': 'bibleReference',
                'data-verses': JSON.stringify(verses),
                style: 'color: green',
                onClick: `onBibleReferenceClick('${spanId}', ${JSON.stringify(verses)})`,
            },
            0,
        ];
    },
});

export const parseBibleReferences = (tiptap: { doc: ContentNode }): VerseReference[] => {
    const references: VerseReference[] = [];

    const traverseContent = (node: ContentNode) => {
        if (node.type === 'text' && node.marks) {
            node.marks.forEach((mark) => {
                if (mark.type === 'bibleReference' && mark.attrs?.verses) {
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
