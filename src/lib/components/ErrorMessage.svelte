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

    let didNotRedirect = false;

    const buttonText = gotoPath === '/' ? 'Go Home' : `Go To ${gotoPath.replace('/', '')}`;

    const error = uncastError as Error | FetchError | ApiError | TokenMissingError | AuthUninitializedError;

    onMount(() => {
        if (isApiErrorWithStatus(error, 404) || $page.status === 404) {
            goto(gotoPath);
        } else {
            didNotRedirect = true;
        }
    });
</script>

{#if didNotRedirect}
    <div class="flex h-[calc(100vh-39px)] w-full items-center justify-center">
        <div class="flex grow flex-col items-center">
            <h1 class="text-4xl">An error occurred</h1>
            <button on:click={() => goto(gotoPath)} class="btn btn-primary mt-4 capitalize">{buttonText}</button>
        </div>
    </div>
{:else}
    <CenteredSpinnerFullScreen />
{/if}
