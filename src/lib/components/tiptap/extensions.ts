import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Highlight from '@tiptap/extension-highlight';
import Subscript from '@tiptap/extension-subscript';
import CharacterCount from '@tiptap/extension-character-count';
import Superscript from '@tiptap/extension-superscript';
import TextStyle from '@tiptap/extension-text-style';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import { bibleReferenceMark } from '$lib/components/tiptap/bibleReferenceMark';
import { resourceReferenceMark } from '$lib/components/tiptap/resourceReferenceMark';
import { commentsMark } from '$lib/components/tiptap/commentsMark';
import type { CommentStores } from '$lib/stores/comments';
import TextDirectionAuto from './textDirectionAuto';
import { filterBoolean } from '$lib/utils/array';
import { Video } from './video';
import type { ScriptDirection } from '$lib/types/base';

export function extensions(
    canComment: boolean,
    commentStores: CommentStores | undefined,
    includeTextDirection: boolean,
    languageScriptDirection: ScriptDirection | undefined
) {
    return filterBoolean([
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
        bibleReferenceMark.configure({}),
        resourceReferenceMark.configure({}),
        commentsMark.configure({ render: canComment, commentStores: commentStores }),
        Video.configure({}),
        includeTextDirection &&
            TextDirectionAuto.configure({
                defaultDirection: languageScriptDirection,
                types: ['heading', 'paragraph', 'orderedList', 'bulletList', 'listItem'],
            }),
    ]);
}
