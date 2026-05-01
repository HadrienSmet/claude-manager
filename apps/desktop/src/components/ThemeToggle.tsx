import { PiMoon, PiSun } from "react-icons/pi";
import { useTranslation } from "react-i18next";

import { THEME, useTheme } from "../contexts";

const TOGGLE_WIDTH = 70 as const;
const TOGGLE_HEIGHT = 32 as const;
const TOGGLE_PADDING = 2 as const;
const ICON_SIZE = 16 as const;

export const ThemeToggle = () => {
    const { theme, toggleTheme } = useTheme();
    const { t } = useTranslation();
    const isDark = theme === THEME.dark;

    return (
        <button
            onClick={toggleTheme}
            aria-label={isDark ? t("theme.ariaLight") : t("theme.ariaDark")}
            className="relative inline-flex shrink-0 items-center rounded-full"
            style={{
                width: TOGGLE_WIDTH,
                height: TOGGLE_HEIGHT,
                padding: TOGGLE_PADDING,
                backgroundColor: "var(--bg-subtle)",
            }}
        >
            {/* Sun icon — opposite side when dark */}
            <PiSun
                size={ICON_SIZE - 2}
                className="absolute"
                style={{
                    left: (TOGGLE_HEIGHT - ICON_SIZE) / 2,
                    color: "var(--text-muted)",
                    opacity: isDark ? 1 : 0,
                    transition: "opacity 0.2s ease",
                }}
            />

            {/* Moon icon — opposite side when light */}
            <PiMoon
                size={ICON_SIZE - 2}
                className="absolute"
                style={{
                    right: (TOGGLE_HEIGHT - TOGGLE_PADDING - ICON_SIZE) / 2,
                    color: "var(--text-muted)",
                    opacity: isDark ? 0 : 1,
                    transition: "opacity 0.2s ease",
                }}
            />

            {/* Sliding knob with active-theme icon */}
            <span
                className="relative z-10 flex items-center justify-center rounded-full"
                style={{
                    width: TOGGLE_HEIGHT - TOGGLE_PADDING * 2,
                    height: TOGGLE_HEIGHT - TOGGLE_PADDING * 2,
                    backgroundColor: "var(--bg-surface)",
                    color: "var(--text-primary)",
                    boxShadow: "0 1px 4px rgba(0,0,0,0.25)",
                    transform: isDark ? `translateX(${TOGGLE_WIDTH - TOGGLE_HEIGHT}px)` : "translateX(0)",
                    transition: "transform 0.2s ease",
                }}
            >
                {isDark ? <PiMoon size={ICON_SIZE} /> : <PiSun size={ICON_SIZE} />}
            </span>
        </button>
    );
};
