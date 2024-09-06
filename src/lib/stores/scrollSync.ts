import { writable } from 'svelte/store';

export const scrollPosition = writable(0);
export const isSyncScrollEnabled = writable(true);

// below are experiments of encapsulating logic on the store
// const createScrollStore = () => {
//     const { subscribe, set } = writable(0);
//     let scrollableDiv: HTMLDivElement | null = null;

//     const setScrollableDiv = (div: HTMLDivElement) => {
//         scrollableDiv = div;
//     };

//     const handleScroll = () => {
//         if (!scrollableDiv) return;

//         const scrollTop: number = scrollableDiv.scrollTop;
//         const scrollHeight: number = scrollableDiv.scrollHeight;
//         const clientHeight: number = scrollableDiv.clientHeight;

//         set(scrollTop / (scrollHeight - clientHeight));
//     };

//     const updateScrollPosition = () => (targetDiv: HTMLDivElement) => {
//         const scrollHeight = targetDiv.scrollHeight;
//         const clientHeight = targetDiv.clientHeight;

//         // targetDiv.scrollTop = get() * (scrollHeight - clientHeight);
//     };

//     return {
//         subscribe,
//         setScrollableDiv,
//         handleScroll,
        // updateScrollPosition: (scrollableDiv: HTMLDivElement) => {
        //     const scrollHeight = scrollableDiv.scrollHeight;
        //     const clientHeight = scrollableDiv.clientHeight;

        //     scrollableDiv.scrollTop = percentage;

        //     // scrollableDiv.scrollTop = percentage * (scrollHeight - clientHeight);
        // }
//     };
// };

// export const scrollPosition = createScrollStore();

// export const syncScroll = (() => {
//     let percentage = 0;
//     const scrollPosition = writable(0);

//     const handleScroll = (scrollableDiv: HTMLDivElement) => {
//         if (!scrollableDiv) return;

//         const scrollTop: number = scrollableDiv.scrollTop;
//         const scrollHeight: number = scrollableDiv.scrollHeight;
//         const clientHeight: number = scrollableDiv.clientHeight;

//         percentage = scrollTop / (scrollHeight - clientHeight);
//     };

//     const updateScrollPosition = (targetDiv: HTMLDivElement) => {
//         const scrollHeight = targetDiv.scrollHeight;
//         const clientHeight = targetDiv.clientHeight;

//         scrollPosition.set(percentage * (scrollHeight - clientHeight));
//     };

//     return {
//         scrollPosition,
//         handleScroll,
//         updateScrollPosition,
//     };
// })();
