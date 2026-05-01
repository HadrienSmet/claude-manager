import type { JSX } from "react";

export const RepositoriesPage = (): JSX.Element => {
    return (
        <div className="p-8">
            <div className="mb-6">
                <h1 className="text-xl font-semibold text-gray-100">Repositories</h1>
                <p className="mt-1 text-sm text-gray-500">
                    Manage the Git repositories registered with Claude Manager.
                </p>
            </div>

            <div className="rounded-lg border border-dashed border-gray-700 p-12 text-center">
                <div className="text-3xl mb-3">🗂</div>
                <p className="text-sm font-medium text-gray-300">No repositories yet</p>
                <p className="mt-1 text-xs text-gray-600">
                    Repository registration will be available in a future update.
                </p>
            </div>
        </div>
    );
};
