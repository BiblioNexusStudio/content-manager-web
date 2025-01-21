import type { CommentStores } from '$lib/stores/comments';
import TextDirectionAuto from './extensions/text-direction-auto';
import { filterBoolean } from '$lib/utils/array';
import type { ScriptDirection } from '$lib/types/base';
import {
    Link,
    officialMarks,
    officialNodes,
    configureAndOverrideExtensions,
    editOnlyExtensions,
    customExtensions,
    Heading,
    ParagraphWithIndentation,
    OrderedListWithIndentation,
    BulletListWithIndentation,
    ListItem,
} from 'aquifer-tiptap';
import BibleReference from './extensions/bible-reference';
import ResourceReference from './extensions/resource-reference';
import Comments from './extensions/comments';

export function extensions(
    canComment: boolean,
    commentStores: CommentStores | undefined,
    includeTextDirection: boolean,
    languageScriptDirection: ScriptDirection | undefined,
    isSourceContentArea: boolean
) {
    return filterBoolean([
        ...configureAndOverrideExtensions(officialNodes, [
            Link.configure({
                openOnClick: false,
            }),
        ]),

        ...configureAndOverrideExtensions(officialMarks, []),

        ...configureAndOverrideExtensions(editOnlyExtensions, []),

        ...configureAndOverrideExtensions(customExtensions, [
            BibleReference.configure({ isSourceContentArea }),
            ResourceReference.configure({}),
            Comments.configure({ render: canComment, commentStores: commentStores }),
        ]),

        includeTextDirection &&
            TextDirectionAuto.configure({
                defaultDirection: languageScriptDirection,
                types: [
                    Heading.name,
                    ParagraphWithIndentation.name,
                    OrderedListWithIndentation.name,
                    BulletListWithIndentation.name,
                    ListItem.name,
                ],
            }),
    ]);
}
