import { type Writable, writable } from 'svelte/store';
import type { User } from '$lib/types/base';
import type { ProjectResponse } from '$lib/types/projects';

export const users: Writable<User[] | null> = writable(null);
export const project: Writable<ProjectResponse | null> = writable(null);
