import defaultTheme from 'tailwindcss/defaultTheme'

/** @type {import('tailwindcss').Config} */
export default {
    darkMode: 'class',
    content: [
        "./app/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                navy: '#1B2A4A',
                gold: '#C9A84C',
                cream: '#FAF6F0',
                charcoal: '#2D2D2D',
            },
            fontFamily: {
                serif: ['Playfair Display', 'serif'],
            },
        },
    },
    plugins: [],
}
