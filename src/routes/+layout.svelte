<script lang="ts">
    import '../app.css';
    import UserLoggedInIcon from '$lib/icons/UserLoggedInIcon.svelte';
    import UserLoggedOutIcon from '$lib/icons/UserLoggedOutIcon.svelte';
    import LoginIcon from '$lib/icons/LoginIcon.svelte';
    import LogoutIcon from '$lib/icons/LogoutIcon.svelte';
    import { Auth0Client, createAuth0Client } from '@auth0/auth0-spa-js';
    import { page } from '$app/stores';
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    import config from '$lib/config';

    let isAuthenticated: boolean;
    let auth0Client: Auth0Client;
    let auth0Domain = config.PUBLIC_AUTH0_DOMAIN;
    let auth0ClientId = config.PUBLIC_AUTH0_CLIENT_ID;
    let userNickName: string | undefined = ' ';
    let theme: string | null;
    let userToken: string = '';

    onMount(async () => {
        if (typeof window !== 'undefined') {
            theme = window.localStorage.getItem('dataTheme');
        }

        auth0Client = await createAuth0Client({
            domain: auth0Domain,
            clientId: auth0ClientId,
            useRefreshTokens: true,
            cacheLocation: 'localstorage',
            authorizationParams: {
                audience: 'aquifer-server-dev.azurewebsites.net',
            },
        });

        isAuthenticated = await auth0Client.isAuthenticated();

        console.log(isAuthenticated);
        if (!isAuthenticated && $page.url.searchParams.has('code') && $page.url.searchParams.has('state')) {
            await auth0Client.handleRedirectCallback();
            await goto('/');
            isAuthenticated = await auth0Client.isAuthenticated();
        } else if (isAuthenticated) {
            // Can get claims information out of this.
            userToken = await auth0Client.getTokenSilently();
            let profile = await auth0Client.getUser();
            userNickName = profile?.nickname;
        }
    });

    const login = async () => {
        await auth0Client.loginWithRedirect({
            authorizationParams: {
                redirect_uri: $page.url.href,
            },
        });
    };

    const logout = () => {
        auth0Client.logout({
            logoutParams: {
                returnTo: $page.url.href,
            },
        });
    };

    const toggleTheme = (event: Event) => {
        const input = event.target as HTMLInputElement;
        theme = input.checked ? 'light' : 'night';

        //document.documentElement.setAttribute('data-theme', theme);

        const one_year = 60 * 60 * 24 * 365;
        document.cookie = `dataTheme=${theme}; max-age=${one_year}; path=/; SameSite=Lax;`;
        document.documentElement.setAttribute('data-theme', theme);
    };

    console.log($page.url.href);
</script>

<svelte:head>
    <title>Content Manager</title>
</svelte:head>

<div class="navbar bg-primary">
    <div class="flex-1">
        <a href="/" class="btn btn-ghost normal-case text-xl">BiblioNexus</a>
    </div>
    <div class="flex-none">
        <div class="grid grid-cols-1 justify-items-end">
            <div class="grid grid-cols-2 gap-2">
                <label class="swap swap-rotate self-start">
                    <input type="checkbox" checked={theme === 'cupcake'} on:change={toggleTheme} />
                    <!-- sun icon -->
                    <svg class="swap-on fill-current w-8 h-8" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                        <path
                            d="M5.64,17l-.71.71a1,1,0,0,0,0,1.41,1,1,0,0,0,1.41,0l.71-.71A1,1,0,0,0,5.64,17ZM5,12a1,1,0,0,0-1-1H3a1,1,0,0,0,0,2H4A1,1,0,0,0,5,12Zm7-7a1,1,0,0,0,1-1V3a1,1,0,0,0-2,0V4A1,1,0,0,0,12,5ZM5.64,7.05a1,1,0,0,0,.7.29,1,1,0,0,0,.71-.29,1,1,0,0,0,0-1.41l-.71-.71A1,1,0,0,0,4.93,6.34Zm12,.29a1,1,0,0,0,.7-.29l.71-.71a1,1,0,1,0-1.41-1.41L17,5.64a1,1,0,0,0,0,1.41A1,1,0,0,0,17.66,7.34ZM21,11H20a1,1,0,0,0,0,2h1a1,1,0,0,0,0-2Zm-9,8a1,1,0,0,0-1,1v1a1,1,0,0,0,2,0V20A1,1,0,0,0,12,19ZM18.36,17A1,1,0,0,0,17,18.36l.71.71a1,1,0,0,0,1.41,0,1,1,0,0,0,0-1.41ZM12,6.5A5.5,5.5,0,1,0,17.5,12,5.51,5.51,0,0,0,12,6.5Zm0,9A3.5,3.5,0,1,1,15.5,12,3.5,3.5,0,0,1,12,15.5Z"
                        />
                    </svg>
                    <!-- moon icon -->
                    <svg class="swap-off fill-current w-8 h-8" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                        <path
                            d="M21.64,13a1,1,0,0,0-1.05-.14,8.05,8.05,0,0,1-3.37.73A8.15,8.15,0,0,1,9.08,5.49a8.59,8.59,0,0,1,.25-2A1,1,0,0,0,8,2.36,10.14,10.14,0,1,0,22,14.05,1,1,0,0,0,21.64,13Zm-9.5,6.69A8.14,8.14,0,0,1,7.08,5.22v.27A10.15,10.15,0,0,0,17.22,15.63a9.79,9.79,0,0,0,2.1-.22A8.11,8.11,0,0,1,12.14,19.73Z"
                        />
                    </svg>
                </label>
                <div class="dropdown dropdown-end">
                    <label tabindex="0" class="inline-flex cursor-pointer">
                        {#if isAuthenticated}
                            <UserLoggedInIcon />
                        {:else}
                            <UserLoggedOutIcon />
                        {/if}
                    </label>
                    <ul class="menu menu-md w-48 dropdown-content mt-3 z-[1] p-0 shadow bg-base-200">
                        <li class="">
                            <button
                                class="hover:bg-primary-focus font-bold"
                                on:click={isAuthenticated ? logout : async () => await login()}
                            >
                                {#if isAuthenticated}
                                    <LogoutIcon />
                                    LOG OUT
                                {:else}
                                    <LoginIcon />
                                    LOG IN
                                {/if}
                            </button>
                        </li>
                    </ul>
                </div>
            </div>
            <div class="text-sm h-4">{userNickName}</div>
        </div>
    </div>
</div>
<p>{userToken}</p>

<slot />
