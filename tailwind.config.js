/** @type {import('tailwindcss').Config} */
export default {
    content: ['./src/**/*.{html,js,svelte,ts}'],
    theme: {
        extend: {
            colors: {
                'primary-50': 'var(--primary-50)',
                'primary-300': 'var(--primary-300)',
                'base-500': 'var(--base-500)',
                'base-700': 'var(--base-700)',
            },
        },
    },
    plugins: [require('@tailwindcss/typography'), require('daisyui')],
    darkMode: 'class',
    daisyui: {
        themes: [
            {
                biblioNexusLight: {
                    'color-scheme': 'light',
                    primary: '#817556',
                    '--primary-300': '#B5AC8B',
                    '--primary-50': '#F0EDE4',
                    'primary-content': '#FFFFFF',
                    secondary: '#F0EDE4',
                    'secondary-content': '#585133',
                    accent: '#DC8850',
                    neutral: '#475467',
                    info: '#D0D5DD',
                    'base-content': '#101828',
                    '--base-700': '#344054',
                    '--base-500': '#667085',
                    'base-200': '#F9FAFB',
                    'base-100': '#ffffff',
                },
            },
            {
                biblioNexusDark: {
                    'color-scheme': 'dark',
                    primary: '#a0967e',
                    '--primary-300': '#776e5a',
                    '--primary-50': '#3c372d',
                    'primary-content': '#202020',
                    secondary: '#232427',
                    'secondary-content': '#bbbbbb',
                    accent: '#DC8850',
                    neutral: '#7e8795',
                    info: '#686b6f',
                    'base-content': '#dedfe2',
                    '--base-700': '#b2b2b5',
                    '--base-500': '#858688',
                    'base-200': '#232427',
                    'base-100': '#202020',
                },
            },
        ],
        darkTheme: 'biblioNexusDark', // name of one of the included themes for dark mode
        base: true, // applies background color and foreground color for root element by default
        styled: true, // include daisyUI colors and design decisions for all components
        utils: true, // adds responsive and modifier utility classes
        rtl: false, // rotate style direction from left-to-right to right-to-left. You also need to add dir="rtl" to your html tag and install `tailwindcss-flip` plugin for Tailwind CSS.
        prefix: '', // prefix for daisyUI classnames (components, modifiers and responsive class names. Not colors)
        logs: false, // Shows info about daisyUI version and used config in the console when building your CSS
    },
};
