<script lang="ts">
    import '$lib/utils/fetch-patch';
    import '../app.css';
    import AquiferLogo from '$lib/images/AquiferOnDark.svg';
    import LoginIcon from '$lib/icons/LoginIcon.svelte';
    import BarChartIcon from '$lib/icons/BarChartIcon.svelte';
    import SquareStackIcon from '$lib/icons/SquareStackIcon.svelte';
    import UsersIcon from '$lib/icons/UsersIcon.svelte';
    import MenuIcon from '$lib/icons/MenuIcon.svelte';
    import SunIcon from '$lib/icons/SunIcon.svelte';
    import MoonIcon from '$lib/icons/MoonIcon.svelte';
    import PieChartIcon from '$lib/icons/PieChartIcon.svelte';
    import ProjectsIcon from '$lib/icons/ProjectsIcon.svelte';
    import { page } from '$app/stores';
    import { onMount } from 'svelte';
    import { _ as translate } from 'svelte-i18n';
    import { logout, profile, auth0Client, syncAuthTokenToCookies, Permission } from '$lib/stores/auth';
    import { log } from '$lib/logger';
    import type { LayoutData } from './$types';
    import CenteredSpinner from '$lib/components/CenteredSpinner.svelte';
    import { showSideBar } from '$lib/stores/app';

    $: userEmail = $profile?.email ?? ' '; // set to avoid flashing undefined
    $: userFullName = $profile?.name ?? ' ';
    let theme: string | null;

    export let data: LayoutData;

    $: log.pageView($page.route.id ?? '');
    $: sideBarCheck = $showSideBar;

    onMount(() => {
        if (typeof window !== 'undefined') {
            theme = window.localStorage.getItem('dataTheme') ?? 'biblioNexusLight';
        }

        // every minute, fetch a new auth token to store as a cookie for SSR
        const syncCookiesInterval = setInterval(syncCookies, 60 * 1000);

        return () => clearInterval(syncCookiesInterval);
    });

    const toggleTheme = (event: Event) => {
        const input = event.target as HTMLInputElement;
        theme = input.checked ? 'biblioNexusLight' : 'biblioNexusDark';

        const one_year = 60 * 60 * 24 * 365;
        document.cookie = `dataTheme=${theme}; max-age=${one_year}; path=/; SameSite=Lax;`;
        document.documentElement.setAttribute('data-theme', theme);
    };

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
            hidden: !data.currentUser.can(Permission.ReadReports),
        },
        {
            name: $translate('sidebar.projects.value'),
            icon: ProjectsIcon,
            href: '/projects',
            hidden: !data.currentUser.can(Permission.ReadProjects),
        },
        {
            name: $translate('sidebar.users.value'),
            icon: UsersIcon,
            href: '/users',
            hidden: !data.currentUser.can(Permission.ReadUsers),
        },
    ];

    function onError(event: Event) {
        if ('error' in event) {
            const error = event.error as Error;
            log.exception(error);
        }
    }

    function onRejection(event: PromiseRejectionEvent) {
        const error = event.reason as Error;
        event.preventDefault();
        log.exception(error);
    }

    function syncCookies() {
        syncAuthTokenToCookies(auth0Client, $page.url, false);
    }
</script>

<svelte:head>
    <title>Aquifer Admin</title>
</svelte:head>

<svelte:window on:error={onError} on:unhandledrejection={onRejection} />

{#if !data.isAuthenticated}
    <!-- If not authenticated, show a spinner, since either: -->
    <!--     1) this is SSR and the user is authenticated locally, in which case the client will recover -->
    <!--     2) the user is legitimately not authenticated, in which case they'll be redirected to Auth0 -->
    <CenteredSpinner />
{:else if data.loaded}
    <div class="drawer {sideBarCheck ? 'lg:drawer-open' : ''}">
        <input id="main-drawer" type="checkbox" class="drawer-toggle" bind:checked={sideBarCheck} />
        <div class="drawer-content">
            <!-- Page content here -->
            <label for="main-drawer" class="btn btn-link btn-active drawer-button btn-xs justify-start p-1 lg:hidden"
                ><MenuIcon /></label
            >
            <slot />
        </div>
        <div class="drawer-side">
            <!-- Sidebar content here -->
            <label for="main-drawer" class="drawer-overlay" />
            <div class="flex h-full w-48 flex-col bg-neutral pb-1">
                <div class="m-2 flex-grow-0"><img src={AquiferLogo} alt="Aquifer" /></div>

                {#each sidebarNavigation as navItem}
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
                    <div class="grid grid-cols-4 content-center">
                        <div class="col-span-3 text-sm font-bold text-white">
                            {userFullName}
                        </div>
                        <div class="flex items-center justify-end">
                            <div class="tooltip tooltip-left" data-tip={$translate('sidebar.logout.value')}>
                                <button
                                    class="btn btn-link m-0 h-4 min-h-0 w-4 p-0 text-neutral-100"
                                    on:click={() => logout($page.url)}
                                >
                                    <LoginIcon />
                                </button>
                            </div>
                        </div>
                    </div>
                    <div class="mb-2 text-[10px]">{userEmail}</div>
                    <label class="swap-rotate swap mb-1 mt-2 hidden h-4 w-4 place-self-center">
                        <input type="checkbox" checked={theme === 'biblioNexusLight'} on:change={toggleTheme} />
                        <SunIcon />
                        <MoonIcon />
                    </label>
                </div>
            </div>
        </div>
    </div>
{/if}
