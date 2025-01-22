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

export class AuthUninitializedError extends Error {
    isAuthUninitializedError = true;
    name = 'AuthUninitializedError' as const;
    message = 'Auth is uninitialized. This means you forgot to call `await parent()` in a `+page.ts` load function.';
}

export class TokenMissingError extends Error {
    isTokenMissingError = true;
    name = 'TokenMissingError' as const;
    message = 'Auth token is missing.';
}

export function isApiErrorWithStatus(error: unknown, status: number): error is ApiError {
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
/*
When the validator throws an error, the errors object will be keyed by the parameter name that failed validation.
Pass an array of parameter keys for the api request to this function to get the error message for the first parameter that failed validation.
Returns a string if the error is found, false if the error is not found or if the error is not an ApiError.
*/

export function parseApiValidatorErrorMessage(error: unknown, parameterKeys: string[]): string | boolean {
    if (error instanceof ApiError) {
        if (typeof error.body === 'object') {
            const errorBody = error.body as { message: string; errors: Record<string, unknown[]> };
            for (const key of parameterKeys) {
                if (
                    key in errorBody.errors &&
                    Array.isArray(errorBody.errors[key]) &&
                    typeof errorBody.errors[key][0] === 'string'
                ) {
                    return errorBody.errors[key][0];
                }
            }
        }
    }
    return false;
}
