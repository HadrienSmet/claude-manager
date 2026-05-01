import { PropsWithChildren, useEffect, useState } from "react";

import { THEME, Theme, ThemeContext } from "./ThemeContext";

export const ThemeProvider = ({ children }: PropsWithChildren) => {
    const [theme, setTheme] = useState<Theme>(THEME.dark);

	useEffect(() => {
		const theme = localStorage.getItem("theme") === THEME.light 
			? THEME.light 
			: THEME.dark;

		setTheme(theme);
	}, []);

    const toggleTheme = () => {
        setTheme((t) => {
            const next = t === THEME.dark 
				? THEME.light 
				: THEME.dark;

            localStorage.setItem("theme", next);

            return (next);
        });
    };

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};
