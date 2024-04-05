<script lang="ts">
    import type { ResourceContent, SingleLicenseInfo } from '$lib/types/resources';

    export let resourceContent: ResourceContent;

    let licenseInfo = resourceContent.parentResourceLicenseInfo!;
    let englishLicenses = licenseInfo.licenses.map(({ eng }) => eng).filter(Boolean) as SingleLicenseInfo[];
    let englishLicensesForAdaptation = englishLicenses.filter(({ name }) => name.toLowerCase() !== 'public domain');
    let container: HTMLDivElement;
    let show = false;
    $: console.log(show);

    const handleClick = (e: MouseEvent) => {
        if (!container.contains(e.target as Node)) {
            show = false;
        }
    };
</script>

<svelte:window on:click={handleClick} />

<div bind:this={container} class="dropdown dropdown-top">
    <div
        tabindex="0"
        role="button"
        class="btn btn-ghost btn-sm text-gray-600 hover:bg-[#e6f7fc]"
        on:mouseup={() => (show = !show)}
    >
        License Info
    </div>
    {#if show}
        <!-- svelte-ignore a11y-no-noninteractive-tabindex -->
        <div
            tabindex="0"
            class="dropdown-content flex w-[30rem] flex-col space-y-2 rounded-md border border-base-300 bg-white
        p-6"
        >
            <div class="flex flex-row space-x-1">
                {#each englishLicenses as license, i (i)}
                    {@const spacer = i !== englishLicenses.length - 1 ? ';' : ''}
                    {#if license.url}
                        <a class="text-primary" href={license.url} target="_blank" rel="noopener noreferrer"
                            >{license.name}</a
                        >{spacer}
                    {:else}
                        <span>{license.name}{spacer}</span>
                    {/if}
                {/each}
            </div>
            <div>
                {licenseInfo.copyright.holder.name +
                    (licenseInfo.copyright.dates ? ' ©' + licenseInfo.copyright.dates : '')}
            </div>
            {#if licenseInfo.copyright.holder.url}
                <div>
                    <a
                        class="text-primary"
                        href={licenseInfo.copyright.holder.url}
                        target="_blank"
                        rel="noopener noreferrer">{licenseInfo.copyright.holder.url}</a
                    >
                </div>
            {/if}
            {#if resourceContent.language.iso6393Code.toLowerCase() === 'eng' ? licenseInfo.showAdaptationNoticeForEnglish : licenseInfo.showAdaptationNoticeForNonEnglish}
                <div>
                    This work, "{licenseInfo.title}", is adapted from "{licenseInfo.title}" by "{licenseInfo.copyright
                        .holder.name}", used under
                    {englishLicensesForAdaptation.map(({ name }) => name).join(' and ')}. "{licenseInfo.title}" is
                    licensed under
                    {englishLicensesForAdaptation.map(({ name }) => name).join(' and ')} by BiblioNexus.
                </div>
            {/if}
        </div>
    {/if}
</div>
