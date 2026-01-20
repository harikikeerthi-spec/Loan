tailwind.config = {
    darkMode: "class",
    theme: {
        extend: {
            colors: {
                "primary": "#a855f7", // Softer Lavender font color
                "background-light": "#fdfcff",
                "background-dark": "#0f0a1a",
                "gold-accent": "#fde68a",
                "gold": "#fde68a",
            },
            fontFamily: {
                "display": ["Noto Serif", "serif"],
                "sans": ["Noto Sans", "sans-serif"],
            },
            borderRadius: { "DEFAULT": "1rem", "lg": "2rem", "xl": "3rem", "full": "9999px" },
            backgroundImage: {
                'mesh-gradient': 'radial-gradient(at 0% 0%, rgba(243, 232, 255, 0.4) 0px, transparent 80%), radial-gradient(at 100% 0%, rgba(254, 252, 232, 0.3) 0px, transparent 80%), radial-gradient(at 100% 100%, rgba(224, 242, 254, 0.4) 0px, transparent 80%), radial-gradient(at 0% 100%, rgba(219, 234, 254, 0.3) 0px, transparent 80%)',
            }
        },
    },
};
