<script lang="ts">
    import {
        isApiErrorWithStatus,
        ApiError,
        AuthUninitializedError,
        FetchError,
        TokenMissingError,
    } from '$lib/utils/http-errors';
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    import { page } from '$app/stores';
    import CenteredSpinnerFullScreen from './CenteredSpinnerFullScreen.svelte';

    export let uncastError;
    export let gotoPath = '/';

    let buttonText = '';
    let errorMessage = '';
    let didNotRedirect = false;
    const error = uncastError as Error | FetchError | ApiError | TokenMissingError | AuthUninitializedError;

    function handleButtonClick() {
        if (isApiErrorWithStatus(error, 429)) {
            // SvelteKit's goto function does not
            // react to window.location.pathname;
            location.reload();
        }

        goto(gotoPath);
    }

    onMount(() => {
        if (isApiErrorWithStatus(error, 404) || $page.status === 404) {
            goto(gotoPath);
        } else if (isApiErrorWithStatus(error, 429)) {
            buttonText = 'Refresh';
            errorMessage = 'Rate limit exceeded.';
            didNotRedirect = true;
        } else {
            errorMessage = 'An error occurred';
            buttonText = gotoPath === '/' ? 'Go Home' : `Go To ${gotoPath.replace('/', '')}`;
            didNotRedirect = true;
        }
    });
</script>

{#if didNotRedirect}
    <div class="flex h-[calc(100vh-39px)] w-full items-center justify-center">
        <div class="flex grow flex-col items-center">
            <h1 class="text-4xl">{errorMessage}</h1>
            <button on:click={handleButtonClick} class="btn btn-primary mt-4 capitalize">{buttonText}</button>
        </div>
    </div>
{:else}
    <CenteredSpinnerFullScreen />
{/if}
