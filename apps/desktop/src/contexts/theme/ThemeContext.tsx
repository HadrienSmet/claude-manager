import { createContext, useContext } from "react";

export const THEME = {
	dark: "dark",
	light: "ligh",
} as const;
export type Theme = typeof THEME[keyof typeof THEME];

type ThemeContextValue = {
    readonly theme: Theme;
    readonly toggleTheme: () => void;
};

export const ThemeContext = createContext<ThemeContextValue | null>(null);

export const useTheme = (): ThemeContextValue => {
    const ctx = useContext(ThemeContext);

    if (!ctx) throw new Error("useTheme must be used within ThemeProvider");

    return (ctx);
};
