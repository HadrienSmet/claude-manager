import { apiFetch } from "./client";
import { Repo } from "./types";

export const listRepos = (): Promise<Repo[]> => apiFetch<Repo[]>("/repos");
