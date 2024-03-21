﻿import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Highlight from '@tiptap/extension-highlight';
import Subscript from '@tiptap/extension-subscript';
import CharacterCount from '@tiptap/extension-character-count';
import Superscript from '@tiptap/extension-superscript';
import TextStyle from '@tiptap/extension-text-style';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import * as customMarks from '$lib/components/tiptap/customMarks';
import TextDirection from 'tiptap-text-direction';

export function extensions() {
    return [
        StarterKit.configure({}),
        Image.configure({}),
        Link.configure({
            openOnClick: false,
        }),
        Underline.configure({}),
        Highlight.configure({}),
        Subscript.configure({}),
        Superscript.configure({}),
        TextStyle.configure({}),
        CharacterCount.configure({}),
        customMarks.bibleReferenceMark.configure({}),
        customMarks.resourceReferenceMark.configure({}),
        TextDirection.configure({
            types: ['heading', 'paragraph', 'orderedList', 'bulletList', 'listItem'],
        }),
    ];
}