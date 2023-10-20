import * as env from '$env/static/public';

export default env as unknown as Configuration;

export interface Configuration {
    PUBLIC_APPLICATION_INSIGHTS_CONNECTION_STRING: string;
    PUBLIC_ENV: string;
    PUBLIC_AQUIFER_API_URL: string;
    PUBLIC_AUTH0_DOMAIN: string;
    PUBLIC_AUTH0_CLIENT_ID: string;
    PUBLIC_AUTH0_AUDIENCE: string;
}
