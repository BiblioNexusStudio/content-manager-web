/** @type {import('tailwindcss').Config} */
export default {
    content: ['./src/**/*.{html,js,svelte,ts}'],
    theme: {
        extend: {
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
    plugins: [require('@tailwindcss/typography'), require('daisyui')],
    daisyui: {
        themes: [
            {
                biblioNexusLight: {
                    'color-scheme': 'light',
                    primary: '#00A3E0',
                    'primary-focus': '#0174a3',
                    'primary-content': '#FFFFFF',
                    secondary: '#BABABA',
                    'secondary-focus': '#676767',
                    'secondary-content': '#FCFCFD',
                    neutral: '#344054',
                    'neutral-focus': '#1D2939',
                    'neutral-content': '#D0D5DD',
                    'neutral-default': '#475467',
                    'neutral-disabled': '#98A2B3',
                    'base-content': '#000000',
                    'base-300': '#D0D5DD',
                    'base-200': '#F4F5F7',
                    'base-100': '#ffffff',
                    info: '#D0D5DD',
                    accent: '#DC8850',
                    error: '#f04438',
                    'error-focus': '#d92d20',
                    'error-content': '#fef3f2',
                    'error-text': '#B42318',
                    'error-text-active': '#912018',
                    'error-disabled': '#FDA29B',
                    warning: '#F79009',
                    'warning-focus': '#DC6803',
                    'warning-content': '#FFFAEB',
                    'warning-text': '#B54708',
                    'warning-text-active': '#93370D',
                    success: '#17B26A',
                    'success-focus': '#079455',
                    'success-content': '#ECFDF3',
                    'success-text': '#067647',
                    'success-text-active': '#085D3A',
                    '--tw-prose-links-override': '#00A3E0',
                },
            },
        ],
        base: true, // applies background color and foreground color for root element by default
        styled: true, // include daisyUI colors and design decisions for all components
        utils: true, // adds responsive and modifier utility classes
        rtl: false, // rotate style direction from left-to-right to right-to-left. You also need to add dir="rtl" to your html tag and install `tailwindcss-flip` plugin for Tailwind CSS.
        prefix: '', // prefix for daisyUI classnames (components, modifiers and responsive class names. Not colors)
        logs: false, // Shows info about daisyUI version and used config in the console when building your CSS
    },
};
