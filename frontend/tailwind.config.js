export default {
    content: ["./index.html", "./src/**/*.{ts,tsx}"],
    theme: {
        extend: {
            borderRadius: {
                "2xl": "1rem"
            },
            colors: {
                accent: "var(--accent)",
                panel: "var(--panel)",
                surface: "var(--surface)",
                fg: "var(--fg)",
                muted: "var(--muted)"
            }
        }
    },
    plugins: []
};
