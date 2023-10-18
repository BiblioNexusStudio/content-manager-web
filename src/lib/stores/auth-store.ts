import { writable } from 'svelte/store';

export class AuthState {
    isAuthenticated = false;
    userEmail: string | undefined = ' '; // set to avoid flashing undefined
    userFullName: string | undefined = ' ';
    userToken: string = '';
}

export const authStore = writable<AuthState>(new AuthState());
