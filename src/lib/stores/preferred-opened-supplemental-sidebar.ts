import { browser } from '$app/environment';
import { get, writable } from 'svelte/store';
import { currentUser } from './auth';
import { OpenedSupplementalSideBar } from '$lib/types/resources';

const storedPreferredOpenedSupplementalSideBar = parseInt(
    (browser &&
        get(currentUser) !== null &&
        localStorage.getItem(`biblionexus_sidepanel_setting_${get(currentUser)!.id}`)) ||
        '0'
) as OpenedSupplementalSideBar;

export const currentPreferredOpenedSupplementalSideBar = writable<number>(
    storedPreferredOpenedSupplementalSideBar as OpenedSupplementalSideBar
);

currentPreferredOpenedSupplementalSideBar.subscribe((val) => {
    if (browser && get(currentUser) !== null)
        localStorage.setItem(`biblionexus_sidepanel_setting_${get(currentUser)!.id}`, `${val}`);
});

export function setPreferredExtraInfoPanel(panelType: OpenedSupplementalSideBar) {
    currentPreferredOpenedSupplementalSideBar.set(panelType);
}
