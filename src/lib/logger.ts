import { ApplicationInsights, type IExceptionTelemetry } from '@microsoft/applicationinsights-web';
import config from '$lib/config';

const appInsights = new ApplicationInsights({
    config: {
        connectionString: config.PUBLIC_APPLICATION_INSIGHTS_CONNECTION_STRING,
    },
});

appInsights.loadAppInsights();

const additionalProperties = {
    source: 'aquifer-web',
    environment: config.PUBLIC_ENV,
};

export const log = {
    exception: (ex: IExceptionTelemetry) => {
        appInsights.trackException(ex, additionalProperties);
    },
    pageView: (routeId: string) => {
        appInsights.trackPageView({
            name: routeId,
            properties: additionalProperties,
        });
    },
};
