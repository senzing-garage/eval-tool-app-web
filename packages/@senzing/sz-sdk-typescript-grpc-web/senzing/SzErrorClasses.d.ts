/** Base exception for Sz related javascript code.
 * @group Errors
 * @hideconstructor
*/
export declare class SzError extends Error {
}
/**
 * The user-supplied input contained an error.
 * @group Errors
 * @hideconstructor
 */
export declare class SzBadInputError extends SzError {
}
/**
 * The program can provide a remedy and continue.
 * @group Errors
 * @hideconstructor
 */
export declare class SzConfigurationError extends SzError {
}
/** The program can provide a remedy and continue.
 * @group Errors
 * @hideconstructor
*/
export declare class SzReplaceConflictError extends SzError {
}
/** The program can provide a remedy and continue.
 * @hideconstructor
 * @group Errors
*/
export declare class SzRetryableError extends SzError {
}
/** System failure, can't continue.
 * @hideconstructor
 * @group Errors
*/
export declare class SzUnrecoverableError extends SzError {
}
/** Temporary Error for non-dev-complete feature
 * @hideconstructor
 * @group Errors
*/
export declare class SzNotYetImplementedError extends SzError {
    message: string;
}
/** GRPC only error that is handed back when connection is not present
 * @hideconstructor
 * @group Errors
*/
export declare class SzNoGrpcConnectionError extends SzError {
    message: string;
}
/** "Not found
 * @group Errors
 * @hideconstructor
*/
export declare class SzNotFoundError extends SzBadInputError {
}
/** Unknown DataSource
 * @group Errors
 * @hideconstructor
*/
export declare class SzUnknownDataSourceError extends SzBadInputError {
}
/** Database connection lost
 * @group Errors
 * @hideconstructor
*/
export declare class SzDatabaseConnectionLostError extends SzRetryableError {
}
/** Retry timeout exceeded time limit
 * @group Errors
 * @hideconstructor
*/
export declare class SzRetryTimeoutExceededError extends SzRetryableError {
}
/** Database exception
 * @group Errors
 * @hideconstructor
*/
export declare class SzDatabaseError extends SzUnrecoverableError {
}
/** License exception
 * @hideconstructor
 * @group Errors
*/
export declare class SzLicenseError extends SzUnrecoverableError {
}
/** Not initialized
 * @hideconstructor
 * @group Errors
*/
export declare class SzNotInitializedError extends SzUnrecoverableError {
}
/** Could not handle exception
 * @hideconstructor
 * @group Errors
*/
export declare class SzUnhandledError extends SzUnrecoverableError {
}
