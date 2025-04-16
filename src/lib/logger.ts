import { ApplicationInsights, SeverityLevel } from '@microsoft/applicationinsights-web';
import config from '$lib/config';
import { browser } from '$app/environment';
import { isAuthenticatedStore, profile } from './stores/auth';
import { get } from 'svelte/store';
import {
    isApiErrorWithStatus,
    ApiError,
    AuthUninitializedError,
    FetchError,
    TokenMissingError,
} from './utils/http-errors';

const appInsights = new ApplicationInsights({
    config: {
        connectionString: config.PUBLIC_APPLICATION_INSIGHTS_CONNECTION_STRING,
    },
});

if (config.PUBLIC_APPLICATION_INSIGHTS_CONNECTION_STRING) {
    appInsights.loadAppInsights();
} else {
    // eslint-disable-next-line
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

            const ignoredFetchError =
                error.message.includes('Failed to fetch') ||
                error.message.includes('Load failed') ||
                error.message.includes('NetworkError when attempting to fetch resource');

            const ignoredResizeError = error.message.includes(
                'ResizeObserver loop completed with undelivered notifications'
            );

            const ignoredScriptError = error.message.includes('ErrorEvent: Script error.');

            if (ignoredFetchError || ignoredResizeError || ignoredScriptError || 'isTokenMissingError' in error) {
                logToAppInsights = false;
            }

            // eslint-disable-next-line
            console.error(error);

            if (logToAppInsights && !isApiErrorWithStatus(error, 404) && !isApiErrorWithStatus(error, 429)) {
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
    trace: (message: string) => {
        // eslint-disable-next-line
        console.info(message);

        appInsights.trackTrace(
            {
                message,
                severityLevel: SeverityLevel.Information,
            },
            {
                ...additionalProperties,
                ...getUserProperties(),
                ...getBrowserAndScreenSize(),
                isAuthenticated: get(isAuthenticatedStore) ?? 'undefined',
                commitSha: config.PUBLIC_COMMIT_SHA,
            }
        );
    },
    trackEvent: (eventName: string) => {
        browser &&
            appInsights.trackEvent({
                name: eventName,
                properties: {
                    url: window.location.toString(),
                    ...additionalProperties,
                    ...getUserProperties(),
                    ...getBrowserAndScreenSize(),
                },
            });
    },
};
