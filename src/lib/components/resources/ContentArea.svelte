<script lang="ts">
    import { _ as translate } from 'svelte-i18n';
    import { type ResourceContentStatus, ResourceContentStatusEnum } from '$lib/types/base';
    import { MediaTypeEnum, type ResourceContent, OpenedSupplementalSideBar } from '$lib/types/resources';
    import { Icon } from 'svelte-awesome';
    import checkCircleO from 'svelte-awesome/icons/checkCircleO';
    import ban from 'svelte-awesome/icons/ban';
    import StatusColor from './StatusColor.svelte';
    import Tooltip from '../Tooltip.svelte';
    import HistoryIcon from '$lib/icons/HistoryIcon.svelte';
    import CommentSidebarIcon from '$lib/icons/CommentSidebarIcon.svelte';
    import BookSidebarIcon from '$lib/icons/BookSidebarIcon.svelte';
    import type { CommentStores } from '$lib/stores/comments';
    import { onMount } from 'svelte';
    import PersonLinesIcon from '$lib/icons/PersonLinesIcon.svelte';
    import AudioPlayerModal from '../audioPlayer/AudioPlayerModal.svelte';

    export let resourceContent: ResourceContent;
    export let sidebarHistoryAvailable: boolean;
    export let historySidebarOpen: boolean;
    export let onToggleHistoryPane: (animateOpen?: boolean) => void;
    export let commentStores: CommentStores;
    export let openedSupplementalSideBar: OpenedSupplementalSideBar;
    export let resourceContentStatuses: ResourceContentStatus[];

    const commentThreads = commentStores.commentThreads;

    onMount(() => {
        if (sidebarHistoryAvailable && resourceContent.mediaType === MediaTypeEnum.text) {
            onToggleHistoryPane(false);
        }
    });

    const toggleOpenedSupplementalSideBar = (sidebar: OpenedSupplementalSideBar) => {
        if (openedSupplementalSideBar === sidebar) {
            openedSupplementalSideBar = OpenedSupplementalSideBar.None;
        } else {
            openedSupplementalSideBar = sidebar;
        }
    };
</script>

<div class="my-1 flex w-full justify-between">
    <div class="flex flex-col">
        <div class="text-md mb-1 flex">
            <h1 class="me-4 font-bold">{resourceContent.englishLabel}</h1>
            <div class="flex items-end">{resourceContent.parentResourceName}</div>
        </div>
        <div class="text-md flex">
            <div class="me-4">
                {resourceContent.language.englishDisplay}
            </div>
            <div class="me-4 flex items-center">
                <StatusColor status={resourceContent.status} />
                {resourceContentStatuses.find((x) => x.status === resourceContent.status)?.displayName ??
                    $translate('page.resources.table.statuses.none.value')}
            </div>
            <div class="relative flex items-center">
                {#if resourceContent.hasPublishedVersion}
                    <Tooltip
                        position={{ left: '1.5rem', top: '-0.25rem' }}
                        class="border-[#17b26a] text-[#17b26a]"
                        text="Published"
                    >
                        <Icon data={checkCircleO} style="height: 18px; width: auto; color: #17b26a;" />
                    </Tooltip>
                {:else}
                    <Tooltip
                        position={{ left: '1.5rem', top: '-0.25rem' }}
                        class="border-[#485467] text-[#485467]"
                        text="Not Published"
                    >
                        <Icon data={ban} style="height: 18px; width: auto; color: #485467;" />
                    </Tooltip>
                {/if}

                <!-- todo : if has audio -->
                <Tooltip
                    position={{ left: '2.5rem', top: '-0.25rem' }}
                    class="border-primary text-primary"
                    text="Click to play audio"
                >
                    <AudioPlayerModal />
                </Tooltip>
            </div>
        </div>
    </div>
    <div class="flex flex-col items-end space-y-1">
        {#if resourceContent.assignedUser}
            <div class="text-md flex">
                Assigned: {resourceContent.assignedUser.name}
            </div>
        {:else if resourceContent.status === ResourceContentStatusEnum.AquiferizeEditorReview || resourceContent.status === ResourceContentStatusEnum.TranslationEditorReview}
            <div class="text-md flex">Assigned: External User</div>
        {/if}
        <div class="flex">
            {#if sidebarHistoryAvailable && resourceContent.mediaType === MediaTypeEnum.text}
                <Tooltip
                    position={{ right: '3rem', top: '0.25rem' }}
                    class="border-[#485467] text-[#485467]"
                    text={historySidebarOpen ? 'Hide Versions' : 'Show Versions'}
                >
                    <button
                        data-app-insights-event-name="toggle-history-pane-click"
                        class="btn btn-ghost btn-sm {historySidebarOpen && 'bg-[#e6f7fc]'}"
                        on:click={() => onToggleHistoryPane()}
                    >
                        <HistoryIcon />
                    </button>
                </Tooltip>
            {/if}
            {#if $commentThreads?.threads.length}
                {@const active = openedSupplementalSideBar === OpenedSupplementalSideBar.Comments}
                <Tooltip
                    position={{ right: '3rem', top: '0.25rem' }}
                    class="border-[#485467] text-[#485467]"
                    text={active ? 'Hide Comments' : 'Show Comments'}
                >
                    <button
                        data-app-insights-event-name="toggle-comments-pane-click"
                        class="btn btn-ghost btn-sm {active && 'bg-[#e6f7fc]'}"
                        on:click={() => toggleOpenedSupplementalSideBar(OpenedSupplementalSideBar.Comments)}
                    >
                        <CommentSidebarIcon />
                    </button>
                </Tooltip>
            {/if}
            <Tooltip
                position={{ right: '3rem', top: '0.25rem' }}
                class="border-[#485467] text-[#485467]"
                text={openedSupplementalSideBar === OpenedSupplementalSideBar.BibleReferences
                    ? 'Hide Bible References'
                    : 'Show Bible References'}
            >
                <button
                    data-app-insights-event-name="toggle-comments-pane-click"
                    class="btn btn-ghost btn-sm {openedSupplementalSideBar ===
                        OpenedSupplementalSideBar.BibleReferences && 'bg-[#e6f7fc]'}"
                    on:click={() => toggleOpenedSupplementalSideBar(OpenedSupplementalSideBar.BibleReferences)}
                >
                    <BookSidebarIcon />
                </button>
            </Tooltip>
            <Tooltip
                position={{ right: '3rem', top: '0.25rem' }}
                class="border-[#485467] text-[#485467]"
                text={openedSupplementalSideBar === OpenedSupplementalSideBar.VersionStatusHistory
                    ? 'Hide Status History'
                    : 'Show Status History'}
            >
                <button
                    data-app-insights-event-name="toggle-status-history-pane-click"
                    class="btn btn-ghost btn-sm {openedSupplementalSideBar ===
                        OpenedSupplementalSideBar.VersionStatusHistory && 'bg-[#e6f7fc]'}"
                    on:click={() => toggleOpenedSupplementalSideBar(OpenedSupplementalSideBar.VersionStatusHistory)}
                >
                    <PersonLinesIcon />
                </button>
            </Tooltip>
        </div>
    </div>
</div>
