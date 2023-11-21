import { ApplicationInsights } from '@microsoft/applicationinsights-web';
import config from '$lib/config';

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
        if (error && error.name === 'TypeError' && error.message === 'Failed to fetch') {
            console.error(error);
        } else if (error) {
            appInsights.trackException({ exception: error }, additionalProperties);
        }
    },
    pageView: (routeId: string) => {
        appInsights.trackPageView({
            name: routeId,
            properties: additionalProperties,
        });
    },
};
