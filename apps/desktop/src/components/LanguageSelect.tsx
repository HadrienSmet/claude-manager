import { useTranslation } from "react-i18next";

import { Select } from "./Select";
import type { SelectOption } from "./Select";

const LANGUAGES: ReadonlyArray<SelectOption> = [
    { value: "en", label: "English" },
    { value: "fr", label: "Français" },
];

export const LanguageSelect = () => {
    const { i18n } = useTranslation();
    const current = LANGUAGES.some((l) => l.value === i18n.language) ? i18n.language : "en";

    return (
        <Select
            value={current}
            options={LANGUAGES}
            onChange={(code) => {
                i18n.changeLanguage(code);
                localStorage.setItem("language", code);
            }}
        />
    );
};
