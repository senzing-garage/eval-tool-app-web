"use strict";
// ----------------------------------------------------------------------------
// Base SzError
// ----------------------------------------------------------------------------
Object.defineProperty(exports, "__esModule", { value: true });
exports.SzUnhandledError = exports.SzNotInitializedError = exports.SzLicenseError = exports.SzDatabaseError = exports.SzRetryTimeoutExceededError = exports.SzDatabaseConnectionLostError = exports.SzUnknownDataSourceError = exports.SzNotFoundError = exports.SzNoGrpcConnectionError = exports.SzNotYetImplementedError = exports.SzUnrecoverableError = exports.SzRetryableError = exports.SzReplaceConflictError = exports.SzConfigurationError = exports.SzBadInputError = exports.SzError = void 0;
/** Base exception for Sz related javascript code.
 * @group Errors
 * @hideconstructor
*/
class SzError extends Error {
}
exports.SzError = SzError;
// ----------------------------------------------------------------------------
// Category exceptions
// - These exceptions represent categories of actions that can be taken by
//   the calling program.
// ----------------------------------------------------------------------------
/**
 * The user-supplied input contained an error.
 * @group Errors
 * @hideconstructor
 */
class SzBadInputError extends SzError {
}
exports.SzBadInputError = SzBadInputError;
/**
 * The program can provide a remedy and continue.
 * @group Errors
 * @hideconstructor
 */
class SzConfigurationError extends SzError {
}
exports.SzConfigurationError = SzConfigurationError;
/** The program can provide a remedy and continue.
 * @group Errors
 * @hideconstructor
*/
class SzReplaceConflictError extends SzError {
}
exports.SzReplaceConflictError = SzReplaceConflictError;
/** The program can provide a remedy and continue.
 * @hideconstructor
 * @group Errors
*/
class SzRetryableError extends SzError {
}
exports.SzRetryableError = SzRetryableError;
/** System failure, can't continue.
 * @hideconstructor
 * @group Errors
*/
class SzUnrecoverableError extends SzError {
}
exports.SzUnrecoverableError = SzUnrecoverableError;
/** Temporary Error for non-dev-complete feature
 * @hideconstructor
 * @group Errors
*/
class SzNotYetImplementedError extends SzError {
    constructor() {
        super(...arguments);
        this.message = "Feature Not Yet Implemented";
    }
}
exports.SzNotYetImplementedError = SzNotYetImplementedError;
/** GRPC only error that is handed back when connection is not present
 * @hideconstructor
 * @group Errors
*/
class SzNoGrpcConnectionError extends SzError {
    constructor() {
        super(...arguments);
        this.message = "No Connection Configured";
    }
}
exports.SzNoGrpcConnectionError = SzNoGrpcConnectionError;
// ----------------------------------------------------------------------------
// Detail exceptions for SzBadInputException
// - Processing did not complete.
// - These exceptions are "per record" exceptions.
// - The record should be recorded as "bad".  (logged, queued as failure)
// - Processing may continue.
// ----------------------------------------------------------------------------
/** "Not found
 * @group Errors
 * @hideconstructor
*/
class SzNotFoundError extends SzBadInputError {
}
exports.SzNotFoundError = SzNotFoundError;
/** Unknown DataSource
 * @group Errors
 * @hideconstructor
*/
class SzUnknownDataSourceError extends SzBadInputError {
}
exports.SzUnknownDataSourceError = SzUnknownDataSourceError;
// ----------------------------------------------------------------------------
// Detail exceptions for SzRetryableException
// - Processing did not complete.
// - These exceptions may be remedied programmatically.
// - The call to the Senzing method should be retried.
// - Processing may continue.
// ----------------------------------------------------------------------------
/** Database connection lost
 * @group Errors
 * @hideconstructor
*/
class SzDatabaseConnectionLostError extends SzRetryableError {
}
exports.SzDatabaseConnectionLostError = SzDatabaseConnectionLostError;
/** Retry timeout exceeded time limit
 * @group Errors
 * @hideconstructor
*/
class SzRetryTimeoutExceededError extends SzRetryableError {
}
exports.SzRetryTimeoutExceededError = SzRetryTimeoutExceededError;
// ----------------------------------------------------------------------------
// Detail exceptions for SzUnrecoverableException
// - Processing did not complete.
// - These exceptions cannot be remedied programmatically.
// - Processing cannot continue.
// ----------------------------------------------------------------------------
/** Database exception
 * @group Errors
 * @hideconstructor
*/
class SzDatabaseError extends SzUnrecoverableError {
}
exports.SzDatabaseError = SzDatabaseError;
/** License exception
 * @hideconstructor
 * @group Errors
*/
class SzLicenseError extends SzUnrecoverableError {
}
exports.SzLicenseError = SzLicenseError;
/** Not initialized
 * @hideconstructor
 * @group Errors
*/
class SzNotInitializedError extends SzUnrecoverableError {
}
exports.SzNotInitializedError = SzNotInitializedError;
/** Could not handle exception
 * @hideconstructor
 * @group Errors
*/
class SzUnhandledError extends SzUnrecoverableError {
}
exports.SzUnhandledError = SzUnhandledError;
//# sourceMappingURL=SzErrorClasses.js.map