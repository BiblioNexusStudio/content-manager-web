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

<div class="my-6 flex w-full justify-between">
    <div class="flex flex-col">
        <div class="mb-2 flex text-xl">
            <h1 class="me-4 text-3xl font-bold">{resourceContent.englishLabel}</h1>
            <div class="flex items-end">{resourceContent.parentResourceName}</div>
        </div>
        <div class="flex text-xl">
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
                        <Icon data={checkCircleO} style="height: 20px; width: auto; color: #17b26a;" />
                    </Tooltip>
                {:else}
                    <Tooltip
                        position={{ left: '1.5rem', top: '-0.25rem' }}
                        class="border-[#485467] text-[#485467]"
                        text="Not Published"
                    >
                        <Icon data={ban} style="height: 20px; width: auto; color: #485467;" />
                    </Tooltip>
                {/if}
            </div>
        </div>
    </div>
    <div class="flex flex-col items-end space-y-2">
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
        </div>
        {#if resourceContent.assignedUser}
            <div class="flex text-xl">
                Assigned: {resourceContent.assignedUser.name}
            </div>
        {:else if resourceContent.status === ResourceContentStatusEnum.AquiferizeInProgress || resourceContent.status === ResourceContentStatusEnum.TranslationInProgress}
            <div class="flex text-xl">Assigned: External User</div>
        {/if}
    </div>
</div>
