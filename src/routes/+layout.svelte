<script lang="ts">
    import '../app.css';
    import AquiferLogo from '$lib/images/AquiferOnDark.svg';
    import LoginIcon from '$lib/icons/LoginIcon.svelte';
    import BarChartIcon from '$lib/icons/BarChartIcon.svelte';
    import SquareStackIcon from '$lib/icons/SquareStackIcon.svelte';
    import UsersIcon from '$lib/icons/UsersIcon.svelte';
    import MenuIcon from '$lib/icons/MenuIcon.svelte';
    import PieChartIcon from '$lib/icons/PieChartIcon.svelte';
    import ProjectsIcon from '$lib/icons/ProjectsIcon.svelte';
    import { navigating, page } from '$app/stores';
    import { _ as translate } from 'svelte-i18n';
    import { logout, profile, Permission, userCan } from '$lib/stores/auth';
    import { log } from '$lib/logger';
    import { sideBarHiddenOnPage } from '$lib/stores/app';
    import CenteredSpinner from '$lib/components/CenteredSpinner.svelte';
    import type { Navigation } from '@sveltejs/kit';

    $: userFullName = $profile?.name ?? ' '; // set to avoid flashing undefined

    $: log.pageView($page.route.id ?? '');

    let customTransitionPages = [/\/resources\/\d+/];

    function isCustomTransitionNavigation(navigation: Navigation) {
        return customTransitionPages.some((pageRegex) => {
            return navigation.from?.url.toString().match(pageRegex) && navigation.to?.url.toString().match(pageRegex);
        });
    }

    let sidebarNavigation = [
        {
            name: $translate('sidebar.dashboard.value'),
            icon: BarChartIcon,
            href: '/',
            hidden: !$userCan(Permission.ReadResources),
        },
        {
            name: $translate('sidebar.resources.value'),
            icon: SquareStackIcon,
            href: '/resources',
            hidden: !$userCan(Permission.ReadResources),
        },
        {
            name: $translate('sidebar.reporting.value'),
            icon: PieChartIcon,
            href: '/reporting',
            hidden: !$userCan(Permission.ReadReports),
        },
        {
            name: $translate('sidebar.projects.value'),
            icon: ProjectsIcon,
            href: '/projects',
            hidden: !($userCan(Permission.ReadProjects) || $userCan(Permission.ReadProjectsInCompany)),
        },
        {
            name: $translate('sidebar.users.value'),
            icon: UsersIcon,
            href: '/users',
            hidden: !($userCan(Permission.CreateUser) || $userCan(Permission.CreateUserInCompany)),
        },
    ];

    function onError(event: Event) {
        if ('error' in event) {
            log.exception(event.error);
        }
    }

    function onRejection(event: PromiseRejectionEvent) {
        event.preventDefault();
        log.exception(event.reason);
    }

    function onInteraction(e: MouseEvent) {
        let element = e.target as HTMLElement | null;
        for (let i = 0; i < 5; i++) {
            if (element === null) break;

            if (element.dataset?.appInsightsEventName) {
                log.trackEvent(element.dataset.appInsightsEventName);
                break;
            }

            element = element.parentNode as HTMLElement;
        }
    }
</script>

<svelte:head>
    <title>Aquifer Admin</title>
</svelte:head>

<svelte:window on:error={onError} on:unhandledrejection={onRejection} on:click={onInteraction} />

{#if $sideBarHiddenOnPage}
    <slot />
{:else}
    <div class="">
        <div class="flex h-[39px] place-items-center bg-neutral px-4">
            <div class="dropdown-start dropdown dropdown-bottom">
                <div tabindex="0" role="button" class="btn btn-link btn-xs m-1 text-white"><MenuIcon /></div>
                <!-- svelte-ignore a11y-no-noninteractive-tabindex -->
                <ul tabindex="0" class="menu dropdown-content z-50 space-y-2 rounded-sm bg-neutral p-2 shadow">
                    {#each sidebarNavigation as navItem (navItem.href)}
                        {#if !navItem.hidden}
                            <li class="">
                                <a
                                    href={navItem.href}
                                    class="btn btn-ghost btn-neutral btn-block justify-start px-2 text-lg normal-case text-neutral-100"
                                >
                                    <svelte:component this={navItem.icon} />{navItem.name}</a
                                >
                            </li>
                        {/if}
                    {/each}

                    <li class="flex text-neutral-100">
                        <div class="grid-cols-4">
                            <div class="col-span-3 text-sm font-bold text-white">
                                {userFullName}
                            </div>
                            <div class="flex items-center justify-end">
                                <div class="tooltip tooltip-left" data-tip={$translate('sidebar.logout.value')}>
                                    <button
                                        data-app-insights-event-name="logout-click"
                                        class="btn btn-link m-0 h-4 min-h-0 w-4 p-0 text-neutral-100"
                                        on:click={() => logout($page.url)}
                                    >
                                        <LoginIcon />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </li>
                </ul>
            </div>
            <div class="m-2 w-16"><a href="/"><img src={AquiferLogo} alt="Aquifer" /></a></div>
        </div>

        {#if $navigating && !isCustomTransitionNavigation($navigating)}
            <CenteredSpinner />
        {:else}
            <div class="flex max-h-[calc(100vh-39px)] w-full flex-col overflow-y-hidden">
                <slot />
            </div>
        {/if}
    </div>
{/if}
