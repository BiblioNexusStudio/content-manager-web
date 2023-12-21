import { ApplicationInsights } from '@microsoft/applicationinsights-web';
import config from '$lib/config';
import { browser } from '$app/environment';
import { profile } from './stores/auth';
import { get } from 'svelte/store';

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
            (error.message.includes('Failed to fetch') || error.message.includes('Load failed'))
        ) {
            console.error(error);
        } else if (error) {
            console.error(error);
            appInsights.trackException({ exception: error }, { ...additionalProperties, userName: get(profile)?.name });
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
