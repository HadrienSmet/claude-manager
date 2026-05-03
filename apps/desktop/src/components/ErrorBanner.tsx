import type { JSX } from "react";

export const ErrorBanner = ({ message }: { readonly message: string }): JSX.Element => (
    <div className="rounded-md border border-red-300 bg-red-50 px-4 py-2.5 text-sm text-red-700">
        {message}
    </div>
);
