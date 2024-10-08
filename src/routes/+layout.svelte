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
    import { logout, profile, Permission, userCan, currentUser } from '$lib/stores/auth';
    import { log } from '$lib/logger';
    import { sideBarHiddenOnPage } from '$lib/stores/app';
    import type { Navigation } from '@sveltejs/kit';
    import CenteredSpinnerFullScreen from '$lib/components/CenteredSpinnerFullScreen.svelte';
    import config from '$lib/config';
    import type { CurrentUser } from '$lib/types/base';
    import { onMount } from 'svelte';
    import { parentResources } from '$lib/stores/parent-resources';
    import type { LayoutData } from './$types';

    export let data: LayoutData;

    $: userFullName = $profile?.name ?? ' '; // set to avoid flashing undefined

    $: log.pageView($page.route.id ?? '');
    $: syncToClarity($page.route.id ?? '', $currentUser);
    $: $parentResources = data.parentResources;

    let customTransitionPages = [/\/resources\/\d+/];
    let menuElement: HTMLUListElement;

    function isCustomTransitionNavigation(navigation: Navigation) {
        return customTransitionPages.some((pageRegex) => {
            return navigation.from?.url.toString().match(pageRegex) && navigation.to?.url.toString().match(pageRegex);
        });
    }

    function syncToClarity(routeId: string, currentUser: CurrentUser | null) {
        if (currentUser) {
            const tryIdentify = () => {
                if (window.clarity) {
                    window.clarity(
                        'identify',
                        $profile?.email ?? currentUser.id.toString(),
                        undefined,
                        routeId,
                        currentUser.name
                    );
                } else {
                    setTimeout(tryIdentify, 100);
                }
            };
            tryIdentify();
        }
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
            hidden: !$userCan(Permission.ReadResourceLists),
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

    onMount(() => {
        window.dispatchEvent(new Event('svelte-app-loaded')); // tell the app.html to show the page
    });
</script>

<svelte:head>
    <title>Aquifer Admin</title>
    {#if config.PUBLIC_ENV === 'prod'}
        <script type="text/javascript">
            (function (c, l, a, r, i, t, y) {
                c[a] =
                    c[a] ||
                    function () {
                        (c[a].q = c[a].q || []).push(arguments);
                    };
                t = l.createElement(r);
                t.async = 1;
                t.src = 'https://www.clarity.ms/tag/' + i;
                y = l.getElementsByTagName(r)[0];
                y.parentNode.insertBefore(t, y);
            })(window, document, 'clarity', 'script', 'nqsw95gze4');
        </script>
    {/if}
</svelte:head>

<svelte:window on:error={onError} on:unhandledrejection={onRejection} on:click={onInteraction} />

{#if $sideBarHiddenOnPage}
    <slot />
{:else}
    <div class="h-full">
        <div class="flex h-[39px] place-items-center bg-neutral px-4">
            <div class="dropdown-start dropdown dropdown-bottom">
                <div tabindex="0" role="button" class="btn btn-link btn-xs m-1 text-white"><MenuIcon /></div>
                <!-- svelte-ignore a11y-no-noninteractive-tabindex -->
                <ul
                    bind:this={menuElement}
                    tabindex="0"
                    class="dropdown-content z-50 min-w-[250px] space-y-2 rounded-sm bg-neutral p-2 text-neutral-100 shadow"
                >
                    {#each sidebarNavigation as navItem (navItem.href)}
                        {#if !navItem.hidden}
                            <li class="">
                                <a
                                    href={navItem.href}
                                    on:click={menuElement.blur}
                                    class="btn btn-ghost btn-neutral btn-block justify-start px-2 text-lg normal-case"
                                >
                                    <svelte:component this={navItem.icon} />{navItem.name}</a
                                >
                            </li>
                        {/if}
                    {/each}

                    <li class="mx-2">
                        <div class="divider before:bg-neutral-100 after:bg-neutral-100" />
                        <div class="flex place-items-center justify-between">
                            <div class="col-span-3 text-sm font-bold">
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
            <CenteredSpinnerFullScreen />
        {:else}
            <div class="flex h-full max-h-[calc(100vh-39px)] w-full flex-col">
                <slot />
            </div>
        {/if}
    </div>
{/if}
