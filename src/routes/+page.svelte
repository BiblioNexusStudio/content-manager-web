<script lang="ts">
    import AreaChart from '$lib/charts/AreaChart.svelte';
    import TranslateIcon from '$lib/icons/TranslateIcon.svelte';
    import FileIcon from '$lib/icons/FileIcon.svelte';

    let languageOptions = ['English', 'French', 'Tok Pisin']; // comes from api
    let resourceTypes = ['CBBT-ER', 'Tyndale Bible Dictionary', 'Tyndale Study Notes']; // comes from api
    let totalResources = 268;
    let totalResourcesMultiLanguage = 73;
</script>

<div class="grid grid-cols-2 mx-4">
    <div class="col-span-2 text-3xl mt-4 mb-8">Resource Overview</div>
    <div class="text-lg">Resource Snapshot</div>
    <div class="justify-self-end">
        <span
            ><select class="select select-bordered w-5/12 max-w-xs mr-2">
                <option disabled selected>All Languages</option>
                {#each languageOptions as language}
                    <option>{language}</option>
                {/each}
            </select></span
        >
        <span
            ><select class="select select-bordered w-5/12 max-w-xs">
                <option disabled selected>All Resources</option>
                {#each resourceTypes as resource}
                    <option>{resource}</option>
                {/each}
            </select></span
        >
    </div>
    <div class="col-span-2">
        <div class="stats shadow mr-8">
            <div class="stat">
                <div class="stat-figure ml-4">
                    <FileIcon />
                </div>
                <div class="stat-title">Total</div>
                <div class="stat-value">{totalResources}</div>
                <div class="stat-desc">1+ Languages</div>
            </div>
        </div>
        <div class="stats shadow">
            <div class="stat">
                <div class="stat-figure ml-4">
                    <TranslateIcon />
                </div>
                <div class="stat-title">Total</div>
                <div class="stat-value">{totalResourcesMultiLanguage}</div>
                <div class="stat-desc">2+ Languages</div>
            </div>
        </div>
    </div>
    <div>Total Resources</div>
    <div>Translated Resources</div>
    <div><AreaChart /></div>
</div>
