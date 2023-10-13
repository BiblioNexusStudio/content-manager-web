<script lang="ts">
    import '../app.css';
    import AquiferLogo from '$lib/images/AquiferPrimaryColor.svg';
    import LoginIcon from '$lib/icons/LoginIcon.svelte';
    import BarChartIcon from '$lib/icons/BarChartIcon.svelte';
    import SquareStackIcon from '$lib/icons/SquareStackIcon.svelte';
    import UsersIcon from '$lib/icons/UsersIcon.svelte';
    import MenuIcon from '$lib/icons/MenuIcon.svelte';
    import SunIcon from '$lib/icons/SunIcon.svelte';
    import MoonIcon from '$lib/icons/MoonIcon.svelte';
    import PieChartIcon from '$lib/icons/PieChartIcon.svelte';
    import { Auth0Client, createAuth0Client } from '@auth0/auth0-spa-js';
    import { page } from '$app/stores';
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    import config from '$lib/config';
    import { _ as translate } from 'svelte-i18n';

    let isAuthenticated: boolean;
    let auth0Client: Auth0Client;
    let auth0Domain = config.PUBLIC_AUTH0_DOMAIN;
    let auth0ClientId = config.PUBLIC_AUTH0_CLIENT_ID;
    let auth0Audience = config.PUBLIC_AUTH0_AUDIENCE;
    let userEmail: string | undefined = ' '; // set to avoid flashing undefined
    let userFullName: string | undefined = ' ';
    let theme: string | null;
    let userToken: string = '';

    onMount(async () => {
        if (typeof window !== 'undefined') {
            theme = window.localStorage.getItem('dataTheme') ?? 'biblioNexusLight';
        }

        auth0Client = await createAuth0Client({
            domain: auth0Domain,
            clientId: auth0ClientId,
            useRefreshTokens: true,
            cacheLocation: 'localstorage',
            authorizationParams: {
                audience: auth0Audience,
            },
        });

        isAuthenticated = await auth0Client.isAuthenticated();

        if (!isAuthenticated && $page.url.searchParams.has('code') && $page.url.searchParams.has('state')) {
            await auth0Client.handleRedirectCallback();
            await goto('/');
            isAuthenticated = await auth0Client.isAuthenticated();
        }

        if (isAuthenticated) {
            // Can get claims information out of this.
            try {
                userToken = await auth0Client.getTokenSilently();
                let profile = await auth0Client.getUser();
                userEmail = profile?.email;
                userFullName = profile?.name;
            } catch (e) {
                await logout();
            }
        } else {
            await login();
        }
    });

    const login = async () => {
        await auth0Client.loginWithRedirect({
            authorizationParams: {
                redirect_uri: $page.url.href,
            },
        });
    };

    const logout = async () => {
        await auth0Client.logout({
            // logoutParams: {
            //     returnTo: $page.url.href,
            // },
        });
    };

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
            goto: '/',
        },
        {
            name: $translate('sidebar.resources.value'),
            icon: SquareStackIcon,
            goto: '/resources',
        },
        {
            name: $translate('sidebar.reporting.value'),
            icon: PieChartIcon,
            goto: '/reporting',
        },
        {
            name: $translate('sidebar.users.value'),
            icon: UsersIcon,
            goto: '/users',
            hidden: true,
        },
    ];
</script>

<svelte:head>
    <title>Content Manager</title>
</svelte:head>

<div class="drawer lg:drawer-open">
    <input id="main-drawer" type="checkbox" class="drawer-toggle" />
    <div class="drawer-content">
        <!-- Page content here -->
        <label for="main-drawer" class="btn btn-xs btn-active btn-link drawer-button lg:hidden justify-start p-1"
            ><MenuIcon /></label
        >
        <slot />
    </div>
    <div class="drawer-side">
        <!-- Sidebar content here -->
        <label for="main-drawer" class="drawer-overlay" />
        <div class="flex flex-col pb-1 w-48 h-full bg-primary">
            <div class="flex-grow-0 m-2"><img src={AquiferLogo} alt="Aquifer" /></div>

            {#each sidebarNavigation as navItem}
                {#if !navItem.hidden}
                    <div class="flex-grow-0">
                        <button
                            on:click={() => goto(navItem.goto)}
                            class="btn btn-primary btn-block normal-case justify-start px-2 text-lg"
                            ><svelte:component this={navItem.icon} />{navItem.name}</button
                        >
                    </div>
                {/if}
            {/each}

            <div class="flex-grow flex flex-col justify-end text-secondary mx-2">
                <div class="divider" />
                <div class="grid grid-cols-4 content-center">
                    <div class="text-sm font-bold col-span-3">
                        {userFullName}
                    </div>
                    <div class="flex items-center justify-end">
                        <div class="tooltip tooltip-left" data-tip={$translate('sidebar.logout.value')}>
                            <button
                                class="btn btn-link text-secondary m-0 p-0 w-4 h-4 min-h-0"
                                on:click={() => logout()}
                            >
                                <LoginIcon />
                            </button>
                        </div>
                    </div>
                </div>
                <div class="text-[10px]">{userEmail}</div>
                <label class="swap swap-rotate mb-1 mt-2 w-4 h-4 place-self-center">
                    <input type="checkbox" checked={theme === 'biblioNexusLight'} on:change={toggleTheme} />
                    <SunIcon />
                    <MoonIcon />
                </label>
            </div>
        </div>
    </div>
</div>
