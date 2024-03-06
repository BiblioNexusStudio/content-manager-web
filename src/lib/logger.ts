import { ApplicationInsights } from '@microsoft/applicationinsights-web';
import config from '$lib/config';
import { browser } from '$app/environment';
import { isAuthenticatedStore, profile } from './stores/auth';
import { get } from 'svelte/store';
import { AUTH_TOKEN_RETRIEVAL_ERROR } from './utils/http-service';

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

export const log = {
    exception: (error: Error | undefined) => {
        // Distinguish between network errors (which can't be avoided) and other errors we may want to look into
        if (
            error &&
            error.message &&
            (error.message.includes('Failed to fetch') ||
                error.message.includes('Load failed') ||
                error.message.includes(AUTH_TOKEN_RETRIEVAL_ERROR))
        ) {
            console.error(error);
        } else if (error) {
            console.error(error);
            appInsights.trackException(
                { exception: error },
                {
                    ...additionalProperties,
                    userName: get(profile)?.name ?? 'undefined',
                    isAuthenticated: get(isAuthenticatedStore) ?? 'undefined',
                    commitSha: config.PUBLIC_COMMIT_SHA,
                }
            );
        }
    },
    pageView: (routeId: string) => {
        browser &&
            appInsights.trackPageView({
                name: routeId,
                properties: additionalProperties,
            });
    },
};
