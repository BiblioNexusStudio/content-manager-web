import type { ParentResource } from '$lib/types/base';
import { writable } from 'svelte/store';

export const parentResources = writable<ParentResource[]>([]);
