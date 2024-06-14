import { ApplicationInsights } from '@microsoft/applicationinsights-web';
import config from '$lib/config';
import { browser } from '$app/environment';
import { isAuthenticatedStore, profile } from './stores/auth';
import { get } from 'svelte/store';
import type { ApiError, AuthUninitializedError, FetchError, TokenMissingError } from './utils/http-errors';

const appInsights = new ApplicationInsights({
    config: {
        connectionString: config.PUBLIC_APPLICATION_INSIGHTS_CONNECTION_STRING,
    },
});

if (config.PUBLIC_APPLICATION_INSIGHTS_CONNECTION_STRING) {
    appInsights.loadAppInsights();
} else {
    console.warn('No app insights connection string available.');
}

const additionalProperties = {
    source: 'content-manager-web',
    environment: config.PUBLIC_ENV,
};

const getUserProperties = () => {
    const user = get(profile);
    return {
        userName: user?.name ?? 'undefined',
        userEmail: user?.email ?? 'undefined',
    };
};

const getBrowserAndScreenSize = () => {
    if (browser) {
        return {
            browserWidth: window.innerWidth,
            browserHeight: window.innerHeight,
            screenWidth: window.screen.width,
            screenHeight: window.screen.height,
        };
    }
    return {};
};
export const log = {
    exception: (uncastError: unknown) => {
        if (uncastError && typeof uncastError === 'object' && 'message' in uncastError) {
            const error = uncastError as Error | FetchError | ApiError | TokenMissingError | AuthUninitializedError;

            let logToAppInsights = true;

            if (
                'isFetchError' in error &&
                (error.message.includes('Failed to fetch') || error.message.includes('Load failed'))
            ) {
                logToAppInsights = false;
            }

            console.error(error);

            if (logToAppInsights) {
                appInsights.trackException(
                    { exception: error },
                    {
                        ...additionalProperties,
                        ...getUserProperties(),
                        ...getBrowserAndScreenSize(),
                        isAuthenticated: get(isAuthenticatedStore) ?? 'undefined',
                        commitSha: config.PUBLIC_COMMIT_SHA,
                    }
                );
            }
        }
    },
    pageView: (routeId: string) => {
        browser &&
            appInsights.trackPageView({
                name: routeId,
                properties: {
                    ...additionalProperties,
                    ...getUserProperties(),
                    ...getBrowserAndScreenSize(),
                },
            });
    },
    trackEvent: (eventName: string) => {
        browser &&
            appInsights.trackEvent({
                name: eventName,
                properties: {
                    ...additionalProperties,
                    ...getUserProperties(),
                    ...getBrowserAndScreenSize(),
                },
            });
    },
};
