import { PiMoon, PiSun } from "react-icons/pi";

import { THEME, useTheme } from "../contexts";

export const ThemeToggle = () => {
	const { theme, toggleTheme } = useTheme();

    return (
        <button
            onClick={toggleTheme}
            className="w-full flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors text-left"
            style={{ color: "var(--text-secondary)" }}
            onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "var(--bg-hover)";
                e.currentTarget.style.color = "var(--text-primary)";
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "";
                e.currentTarget.style.color = "var(--text-secondary)";
            }}
        >
            <span>{theme === THEME.dark ? <PiSun /> : <PiMoon />}</span>
            <span>{theme === THEME.dark ? "Light mode" : "Dark mode"}</span>
        </button>
    );
};
