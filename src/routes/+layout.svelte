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

    $: userFullName = $profile?.name ?? ' '; // set to avoid flashing undefined

    $: log.pageView($page.route.id ?? '');

    let sidebarNavigation = [
        {
            name: $translate('sidebar.dashboard.value'),
            icon: BarChartIcon,
            href: '/',
        },
        {
            name: $translate('sidebar.resources.value'),
            icon: SquareStackIcon,
            href: '/resources',
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
            hidden: !$userCan(Permission.ReadProjects),
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
    <div class="drawer lg:drawer-open">
        <input id="main-drawer" type="checkbox" class="drawer-toggle" />
        <div class="drawer-content">
            <!-- Page content here -->
            <label for="main-drawer" class="btn btn-link btn-active drawer-button btn-xs justify-start p-1 lg:hidden"
                ><MenuIcon /></label
            >
            {#if $navigating}
                <CenteredSpinner />
            {:else}
                <slot />
            {/if}
        </div>
        <div class="drawer-side z-10">
            <!-- Sidebar content here -->
            <label for="main-drawer" class="drawer-overlay" />
            <div class="flex h-full w-48 flex-col bg-neutral pb-1">
                <div class="m-2 flex-grow-0"><img src={AquiferLogo} alt="Aquifer" /></div>

                {#each sidebarNavigation as navItem (navItem.href)}
                    {#if !navItem.hidden}
                        <div class="flex-grow-0">
                            <a
                                href={navItem.href}
                                class="btn btn-ghost btn-neutral btn-block justify-start px-2 text-lg normal-case text-neutral-100"
                                ><svelte:component this={navItem.icon} />{navItem.name}</a
                            >
                        </div>
                    {/if}
                {/each}

                <div class="mx-2 flex flex-grow flex-col justify-end text-neutral-100">
                    <div class="divider" />
                    <div class="mb-2 grid grid-cols-4 content-center">
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
                </div>
            </div>
        </div>
    </div>
{/if}
