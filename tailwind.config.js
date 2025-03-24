/** @type {import('tailwindcss').Config} */
export default {
    content: ['./src/**/*.{html,js,svelte,ts}'],
    theme: {
        extend: {
            typography: {
                DEFAULT: {
                    css: {
                        blockquote: {
                            fontWeight: 'regular',
                            fontStyle: 'none',
                            quotes: 'none',
                        },
                    },
                },
            },
            screens: {
                short: { raw: '(max-height: 900px)' },
            },
            colors: {
                'primary-50': 'var(--primary-50)',
                'primary-300': 'var(--primary-300)',
                'base-500': 'var(--base-500)',
                'base-700': 'var(--base-700)',
            },
        },
    },
};
