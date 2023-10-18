import { writable } from 'svelte/store';
import type { ResourceItem } from '../types/resources';

export const languageId = writable<number>(1);
