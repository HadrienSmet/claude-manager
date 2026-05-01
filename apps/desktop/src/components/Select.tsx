import { useEffect, useRef, useState } from "react";
import { PiCaretDown, PiCheck } from "react-icons/pi";

export type SelectOption<T extends string = string> = {
    readonly value: T;
    readonly label: string;
};

export type SelectProps<T extends string = string> = {
    readonly value: T;
    readonly options: ReadonlyArray<SelectOption<T>>;
    readonly onChange: (value: T) => void;
};

export const Select = <T extends string>({ value, options, onChange }: SelectProps<T>) => {
    const [open, setOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const current = options.find((o) => o.value === value) ?? options[0]!;

    useEffect(() => {
        const onClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener("mousedown", onClickOutside);
        return () => document.removeEventListener("mousedown", onClickOutside);
    }, []);

    return (
        <div ref={containerRef} className="relative">
            {/* Trigger */}
            <button
                onClick={() => setOpen((o) => !o)}
                className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs border"
                style={{
                    backgroundColor: "var(--bg-subtle)",
                    color: "var(--text-primary)",
                    borderColor: "var(--border)",
                }}
            >
                <span className="font-medium">{current.label}</span>
                <PiCaretDown
                    size={11}
                    style={{
                        color: "var(--text-muted)",
                        transform: open ? "rotate(180deg)" : "rotate(0deg)",
                        transition: "transform 0.2s ease",
                    }}
                />
            </button>

            {/* Dropdown */}
            <div
                className="absolute right-0 rounded-xl py-1 min-w-[130px]"
                style={{
                    bottom: "calc(100% + 6px)",
                    backgroundColor: "var(--bg-card)",
                    border: "1px solid var(--border)",
                    boxShadow: "0 8px 24px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.10)",
                    zIndex: 50,
                    opacity: open ? 1 : 0,
                    transform: open ? "translateY(0) scale(1)" : "translateY(4px) scale(0.97)",
                    pointerEvents: open ? "auto" : "none",
                    transition: "opacity 0.15s ease, transform 0.15s ease",
                    transformOrigin: "bottom right",
                }}
            >
                {options.map((option) => {
                    const isActive = option.value === value;
                    return (
                        <button
                            key={option.value}
                            onClick={() => { onChange(option.value); setOpen(false); }}
                            className="w-full flex items-center justify-between px-3 py-2 text-xs text-left"
                            style={{ color: isActive ? "var(--text-primary)" : "var(--text-secondary)" }}
                            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "var(--bg-hover)"; }}
                            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}
                        >
                            <span className={isActive ? "font-medium" : ""}>{option.label}</span>
                            {isActive && <PiCheck size={12} style={{ color: "var(--text-primary)" }} />}
                        </button>
                    );
                })}
            </div>
        </div>
    );
};
