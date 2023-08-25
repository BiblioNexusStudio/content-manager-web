<script lang="ts">
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
    let userNickName: string | undefined;

    onMount(async () => {
        console.log('in on mount');

        auth0Client = await createAuth0Client({
            domain: auth0Domain,
            clientId: auth0ClientId,
            useRefreshTokens: true,
            cacheLocation: 'localstorage',
        });

        isAuthenticated = await auth0Client.isAuthenticated();

        console.log(isAuthenticated);
        if (!isAuthenticated && $page.url.searchParams.has('code') && $page.url.searchParams.has('state')) {
            await auth0Client.handleRedirectCallback();
            await goto('/');
            isAuthenticated = await auth0Client.isAuthenticated();
        } else if (isAuthenticated) {
            // Can get claims information out of this.
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

    console.log($page.url.href);
</script>

<div class="navbar bg-primary">
    <div class="flex-1">
        <a href="/" class="btn btn-ghost normal-case text-xl">BiblioNexus</a>
    </div>
    <div class="flex-none">
        <div class="grid col-span-1 justify-items-end">
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
            {#if isAuthenticated}
                <div class="text-sm">{userNickName}</div>
            {/if}
        </div>
    </div>
</div>
<div>
    <input type="checkbox" data-toggle-theme="dark,light" data-act-class="ACTIVECLASS" />
</div>
