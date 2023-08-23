import { env } from '$env/dynamic/public';

export default env as Configuration;

export interface Configuration {
    PUBLIC_APPLICATION_INSIGHTS_CONNECTION_STRING: string;
    PUBLIC_ENV: string;
    PUBLIC_AQUIFER_API_URL: string;
}
