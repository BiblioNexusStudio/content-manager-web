import { Mark } from '@tiptap/core';
import { v4 as uuid } from 'uuid';

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
                            verses: [
                                {
                                    startVerse: (node as HTMLElement).getAttribute('data-startVerse'),
                                    endVerse: (node as HTMLElement).getAttribute('data-endVerse'),
                                },
                            ],
                        };
                    }

                    return false;
                },
            },
        ];
    },
    renderHTML({ HTMLAttributes }) {
        const spanId = `bibleref-${uuid()}`;
        const startVerse = HTMLAttributes.verses[0].startVerse;
        const endVerse = HTMLAttributes.verses[0].endVerse;

        return [
            'span',
            {
                id: spanId,
                'data-bnType': 'bibleReference',
                'data-startVerse': startVerse,
                'data-endVerse': endVerse,
                style: 'color: green',
                onClick: `onBibleReferenceClick('${spanId}', '${startVerse}', '${endVerse}')`,
            },
            0,
        ];
    },
});

interface VerseReference {
    startVerse: string | number;
    endVerse: string | number;
}

interface ContentNode {
    type: string;
    marks?: MarkType[];
    content?: ContentNode[];
}

interface MarkType {
    type: string;
    attrs?: {
        verses?: VerseReference[];
    };
}

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
