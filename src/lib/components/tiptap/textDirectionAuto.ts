// ported from https://github.com/amirhhashemi/tiptap-text-direction

// This plugin will detect the correct LTR/RTL direction of each node and compare to the defaultDirection specified.
// If it's different than the default, the `dir` HTML attribute will be set.
// Note: this assumes that the editor's parent element has dir="{defaultDirection}" set.

import { ScriptDirection } from '$lib/types/base';
import { tinySpace } from '$lib/utils/reference';
import { Extension } from '@tiptap/core';
import { EditorState, Plugin, PluginKey } from '@tiptap/pm/state';

const RTL = '\u0591-\u07FF\uFB1D-\uFDFD\uFE70-\uFEFC';
const LTR =
    'A-Za-z\u00C0-\u00D6\u00D8-\u00F6' +
    '\u00F8-\u02B8\u0300-\u0590\u0800-\u1FFF\u200E\u2C00-\uFB1C' +
    '\uFE00-\uFE6F\uFEFD-\uFFFF';

// eslint-disable-next-line
const RTL_REGEX = new RegExp('^[^' + LTR + ']*[' + RTL + ']');
// eslint-disable-next-line
const LTR_REGEX = new RegExp('^[^' + RTL + ']*[' + LTR + ']');

// Source: https://github.com/facebook/lexical/blob/429e3eb5b5a244026fa4776650aabe3c8e17536b/packages/lexical/src/LexicalUtils.ts#L163
function getNodeTextDirection(text: string) {
    if (text.length === 0) {
        return undefined;
    }
    if (RTL_REGEX.test(text)) {
        return ScriptDirection.RTL;
    } else if (LTR_REGEX.test(text)) {
        return ScriptDirection.LTR;
    }
    return undefined;
}

function TextDirectionPlugin({
    types,
    defaultDirection,
}: {
    types: string[];
    defaultDirection: ScriptDirection | undefined;
}) {
    return new Plugin({
        key: new PluginKey('textDirection'),
        state: {
            init(_, state) {
                const tr = updateNodeAttributesWithDir(state, types, defaultDirection);
                if (tr) {
                    state.doc = tr.doc;
                }
            },
            apply(_) {
                // no-op
            },
        },
        appendTransaction: (transactions, _oldState, newState) => {
            const docChanges = transactions.some((transaction) => transaction.docChanged);
            if (!docChanges) {
                return;
            }

            return updateNodeAttributesWithDir(newState, types, defaultDirection);
        },
    });
}

function updateNodeAttributesWithDir(
    state: EditorState,
    types: string[],
    defaultDirection: ScriptDirection | undefined
) {
    let modified = false;
    const tr = state.tr;

    let verseRefsHandled = 0;
    state.doc.descendants((node, pos) => {
        if (types.includes(node.type.name)) {
            const marks = tr.storedMarks || [];
            const direction = getNodeTextDirection(node.textContent);
            if (direction !== defaultDirection) {
                tr.setNodeAttribute(pos + verseRefsHandled * 2, 'dir', direction);
            } else {
                tr.setNodeAttribute(pos + verseRefsHandled * 2, 'dir', undefined);
            }

            // This code is necessary to update Tiptap content that contains Bible verse references in RTL languages
            // like Arabic. It makes sure that a reference like Luke 12:17 shows up as 17:12 Luke instead of 12:17 Luke.
            // It inserts tiny spaces into the content that are almost invisible to humans but the RTL browser handling
            // notices it and formats things correctly.
            if (direction === ScriptDirection.RTL) {
                node.forEach((child, offset) => {
                    if (child.isText && child.text && child.text.match(/\d+:\d+/)) {
                        const regex = /(\d+):(\d+)/g;
                        let match;

                        while ((match = regex.exec(child.text)) !== null) {
                            tr.insertText(
                                `${match[1]}${tinySpace}:${tinySpace}${match[2]}`,
                                pos + offset + match.index + 1 + verseRefsHandled * 2,
                                pos + offset + match.index + 1 + match[0].length + verseRefsHandled * 2
                            );
                            verseRefsHandled++;
                        }
                    }
                });
            }

            // `tr.setNodeAttribute` resets the stored marks so we'll restore them
            for (const mark of marks) {
                tr.addStoredMark(mark);
            }
            modified = true;
        }
    });

    return modified ? tr : null;
}
interface TextDirectionOptions {
    types: string[];
    defaultDirection?: ScriptDirection;
}
const TextDirection = Extension.create<TextDirectionOptions>({
    name: 'textDirection',

    addOptions() {
        return {
            types: [],
        };
    },

    addGlobalAttributes() {
        return [
            {
                types: this.options.types,
                attributes: {
                    dir: {
                        default: undefined,
                        renderHTML: (attributes) => {
                            if (!attributes.dir) {
                                return {};
                            }
                            return { dir: attributes.dir };
                        },
                    },
                },
            },
        ];
    },

    addProseMirrorPlugins() {
        return [
            TextDirectionPlugin({
                types: this.options.types,
                defaultDirection: this.options.defaultDirection,
            }),
        ];
    },
});

export default TextDirection;
