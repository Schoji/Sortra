/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
        "./public/**/*.{js,ts,jsx,tsx,html}",
    ],
    theme: {
        extend: {
            colors: { 'base-100-50': 'oklch(0.3368 0.016 252.42)', }
        },
    },
    plugins: [require("@tailwindcss/typography"), require("daisyui")],
    daisyui: {
        themes: [
            "dark",
        ],

    },
};