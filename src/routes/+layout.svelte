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
    import GearIcon from '$lib/icons/GearIcon.svelte';
    import { navigating, page } from '$app/stores';
    import { _ as translate } from 'svelte-i18n';
    import { logout, profile, Permission, userCan, currentUser } from '$lib/stores/auth';
    import { log } from '$lib/logger';
    import { sideBarHiddenOnPage } from '$lib/stores/app';
    import type { Navigation } from '@sveltejs/kit';
    import CenteredSpinnerFullScreen from '$lib/components/CenteredSpinnerFullScreen.svelte';
    import config from '$lib/config';
    import type { CurrentUser } from '$lib/types/base';
    import { onMount, setContext, type Snippet } from 'svelte';
    import type { LayoutData } from './$types';
    import QuestionMarkIcon from '$lib/icons/QuestionMarkIcon.svelte';
    import Tooltip from '$lib/components/Tooltip.svelte';

    interface Props {
        data: LayoutData;
        children: Snippet;
    }

    let { data, children }: Props = $props();

    let userFullName = $derived($profile?.name ?? ' '); // set to avoid flashing undefined

    $effect(() => log.pageView($page.route.id ?? ''));
    $effect(() => syncToClarity($page.route.id ?? '', $currentUser));
    setContext('parentResources', () => data.parentResources);
    let userHasCompanyLanguages = $derived($currentUser !== null && $currentUser.company.languageIds.length > 0);

    let customTransitionPages = [/\/resources\/\d+/];
    let menuElement: HTMLUListElement | null = $state(null);

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

    let sidebarNavigation = $derived([
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
        {
            name: $translate('sidebar.settings.value'),
            icon: GearIcon,
            href: '/settings',
            hidden: !$userCan(Permission.GetTranslationPair) || !userHasCompanyLanguages,
        },
    ]);

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

<svelte:window onerror={onError} onunhandledrejection={onRejection} onclick={onInteraction} />

{#if $sideBarHiddenOnPage}
    {@render children()}
{:else}
    <div class="h-full">
        <div class="bg-neutral flex h-[39px] place-items-center px-4">
            <div class="dropdown-start dropdown dropdown-bottom">
                <div tabindex="0" role="button" class="btn btn-link btn-xs m-1 text-white"><MenuIcon /></div>
                <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
                <ul
                    bind:this={menuElement}
                    tabindex="0"
                    class="dropdown-content bg-neutral z-50 min-w-[250px] space-y-2 rounded-xs p-2 text-neutral-100 shadow-sm"
                >
                    {#each sidebarNavigation as navItem (navItem.href)}
                        {#if !navItem.hidden}
                            <li class="">
                                <a
                                    href={navItem.href}
                                    onclick={menuElement.blur}
                                    class="btn btn-ghost btn-neutral btn-block justify-start px-2 text-lg normal-case"
                                >
                                    <navItem.icon />{navItem.name}</a
                                >
                            </li>
                        {/if}
                    {/each}

                    <li class="mx-2">
                        <div class="divider before:bg-neutral-100 after:bg-neutral-100"></div>
                        <div class="flex place-items-center justify-between">
                            <div class="col-span-3 text-sm font-bold">
                                {userFullName}
                            </div>
                            <div class="flex items-center justify-end">
                                <div class="tooltip tooltip-left" data-tip={$translate('sidebar.logout.value')}>
                                    <button
                                        data-app-insights-event-name="logout-click"
                                        class="btn btn-link m-0 h-4 min-h-0 w-4 p-0 text-neutral-100"
                                        onclick={() => logout($page.url)}
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
            {#if !$userCan(Permission.CreateCommunityContent)}
                <div class="ml-auto">
                    <Tooltip position={{ right: '3rem', top: '0.25rem' }} class="ml-auto" text="Help">
                        <a
                            href="/help"
                            class="btn btn-neutral btn-xs hover:border-primary hover:text-primary m-1 border border-neutral-300"
                        >
                            <QuestionMarkIcon />
                        </a>
                    </Tooltip>
                </div>
            {/if}
        </div>

        {#if $navigating && !isCustomTransitionNavigation($navigating)}
            <CenteredSpinnerFullScreen />
        {:else}
            <div class="relative flex h-full max-h-[calc(100vh-39px)] w-full flex-col overflow-hidden">
                {@render children()}
            </div>
        {/if}
    </div>
{/if}
