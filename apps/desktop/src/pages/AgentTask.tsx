import type { JSX } from "react";

type StatCardProps = {
    readonly label: string;
    readonly value: string;
};

const StatCard = ({ label, value }: StatCardProps): JSX.Element => {
    return (
        <div className="rounded-lg border border-gray-800 bg-gray-900 px-4 py-3">
            <p className="text-xs text-gray-500">{label}</p>
            <p className="mt-1 text-2xl font-semibold text-gray-100">{value}</p>
        </div>
    );
};

export const AgentTaskPage = (): JSX.Element => {
    return (
        <div className="p-8">
            <div className="mb-6">
                <h1 className="text-xl font-semibold text-gray-100">Agent Task</h1>
                <p className="mt-1 text-sm text-gray-500">
                    View and manage tasks assigned to AI agents.
                </p>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-8">
                <StatCard
                    label="Active tasks"
                    value="0"
                />
                <StatCard
                    label="Completed"
                    value="0"
                />
                <StatCard
                    label="Needs review"
                    value="0"
                />
            </div>

            <div className="rounded-lg border border-dashed border-gray-700 p-12 text-center">
                <div className="text-3xl mb-3">🤖</div>
                <p className="text-sm font-medium text-gray-300">No tasks running</p>
                <p className="mt-1 text-xs text-gray-600">
                    Task assignment will be available once a repository is registered.
                </p>
            </div>
        </div>
    );
};
