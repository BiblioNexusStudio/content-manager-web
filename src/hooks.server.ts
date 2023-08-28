import type { Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
    const theme = event.cookies.get('dataTheme');
    console.log(theme);

    return resolve(event, {
        transformPageChunk: ({ html }) => html.replace('data-theme=""', `data-theme="${theme}"`),
    });
};
