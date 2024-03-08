export class ApiError extends Error {
    isApiError = true;
    name = 'ApiError' as const;

    constructor(
        public status: number,
        public body: string | object | null,
        public path: string,
        public method: string
    ) {
        super(`Status: '${status}'. (${method} ${path}) Body: ${JSON.stringify(body)}.`);
    }
}

export class FetchError extends Error {
    isFetchError = true;
    name = 'FetchError' as const;

    constructor(
        public path: string,
        public method: string,
        message: string
    ) {
        super(`'${message}' (${method} ${path})`);
    }
}

export class TokenError extends Error {
    isTokenError = true;
    name = 'TokenError' as const;
    message = 'Failed to fetch token. May need to refresh or login again.';
}

function isApiErrorWithStatus(error: unknown, status: number): error is ApiError {
    return error instanceof ApiError && error.status === status;
}

export function isAuthorizationError(error: unknown): error is ApiError {
    return isApiErrorWithStatus(error, 403);
}

export function isApiErrorWithMessage(error: unknown, message: string, atKey?: string): boolean {
    if (error instanceof ApiError) {
        if (typeof error.body === 'object') {
            const errorBody = error.body as { message: string; errors: Record<string, unknown> };
            if (atKey) {
                return (
                    Array.isArray(errorBody.errors[atKey]) &&
                    (errorBody.errors[atKey] as unknown[]).some((e) => typeof e === 'string' && e.includes(message))
                );
            } else if (typeof error.body === 'object') {
                return (
                    errorBody.message.includes(message) ||
                    Object.values(errorBody.errors).some(
                        (v) => Array.isArray(v) && v.some((e) => typeof e === 'string' && e.includes(message))
                    )
                );
            }
        }
    }
    return false;
}
