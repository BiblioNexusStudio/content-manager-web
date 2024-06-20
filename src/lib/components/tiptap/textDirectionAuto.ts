// ported from https://github.com/amirhhashemi/tiptap-text-direction

// This plugin will detect the correct LTR/RTL direction of each node and compare to the defaultDirection specified.
// If it's different than the default, the `dir` HTML attribute will be set.
// Note: this assumes that the editor's parent element has dir="{defaultDirection}" set.

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
export function getNodeTextDirection(text: string) {
    if (text.length == 0) {
        return undefined;
    }
    if (RTL_REGEX.test(text)) {
        return 'rtl';
    } else if (LTR_REGEX.test(text)) {
        return 'ltr';
    }
    return undefined;
}

function TextDirectionPlugin({
    types,
    defaultDirection,
}: {
    types: string[];
    defaultDirection: 'ltr' | 'rtl' | undefined;
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

function updateNodeAttributesWithDir(state: EditorState, types: string[], defaultDirection: 'ltr' | 'rtl' | undefined) {
    let modified = false;
    const tr = state.tr;

    state.doc.descendants((node, pos) => {
        if (types.includes(node.type.name)) {
            const marks = tr.storedMarks || [];
            const direction = getNodeTextDirection(node.textContent);
            if (direction !== defaultDirection) {
                tr.setNodeAttribute(pos, 'dir', direction);
            } else {
                tr.setNodeAttribute(pos, 'dir', undefined);
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

export interface TextDirectionOptions {
    types: string[];
    defaultDirection?: 'ltr' | 'rtl';
}

export const TextDirection = Extension.create<TextDirectionOptions>({
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
