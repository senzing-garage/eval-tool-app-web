"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSenzingErrorCode = getSenzingErrorCode;
exports.newException = newException;
exports.bigIntToNumber = bigIntToNumber;
exports.asString = asString;
exports.entityIdsAsJsonString = entityIdsAsJsonString;
exports.recordIdsAsJsonString = recordIdsAsJsonString;
exports.requiredDataSourcesAsJson = requiredDataSourcesAsJson;
exports.entityIdsToAvoidAsJson = entityIdsToAvoidAsJson;
exports.recordKeysToAvoidAsJson = recordKeysToAvoidAsJson;
const SzError_1 = require("./senzing/SzError");
function ltrim(inputStr, searchStr) {
    let start = 0;
    let retVal = inputStr;
    if (!searchStr) {
        return inputStr.replace(/^\s+/gm, '');
    }
    if (inputStr.includes(searchStr)) {
        while (searchStr.indexOf(inputStr[start]) >= 0) {
            start += 1;
        }
        retVal = inputStr.substring(start);
    }
    return retVal;
}
function getSenzingErrorCode(error) {
    let retVal = 0;
    if (!error || error && error.length <= 0) {
        return 0;
    }
    try {
        retVal = parseInt(ltrim(error.split("|")[0].trim(), "SENZ")); // not sure why you would want to "strip(S || E || N || Z)" and not just trim left of instance ??
    }
    catch {
        // bearer:disable javascript_lang_logger
        console.error(`ERROR: Could not parse error text '${error}'`);
    }
    return retVal;
}
/**
 * The other language implementations take an ServiceError object and pull details out of the object
 * but due to the ... non-uniform shape of the two different grpc packages implementations the static
 * analysis complains. the simple solution is to just pull the details out of the error obj
 * BEFORE it gets to the helper sig to avoid type collision issues.
 * @returns
 */
function newException(error) {
    //let retVal          = initialError;
    //let details         = initialError.details;
    let errorDetails = undefined;
    if (error && error.details) {
        errorDetails = error.details;
    }
    else if (error && error.message) {
        errorDetails = error.message;
    }
    if (errorDetails === undefined) {
        return new SzError_1.SzError(errorDetails);
    }
    let detailsAsJSON = {};
    // is JSON?
    try {
        detailsAsJSON = JSON.parse(errorDetails); // check if "details" is a json Object
    }
    catch (err) { }
    let reason = detailsAsJSON["reason"] ? detailsAsJSON["reason"] : "";
    let senzing_error_code = getSenzingErrorCode(reason);
    if (SzError_1.ENGINE_EXCEPTION_MAP.has(senzing_error_code)) {
        let senzing_error_class = SzError_1.ENGINE_EXCEPTION_MAP.get(senzing_error_code);
        return senzing_error_class ? new senzing_error_class(errorDetails) : new SzError_1.SzError(errorDetails);
    }
    return new SzError_1.SzError(errorDetails);
}
/** The SzEngineFlags values are all big int or bitwise operations on bigInt
 * so just casting them to numbers doesn't work due to some values being bitwise ops on
 * long numbers. the casting needs to be done inside the methods handing values to the engine.
*/
function bigIntToNumber(value) {
    if (typeof value === "bigint") {
        return Number(value);
    }
    else {
        return value;
    }
}
/**
 * Given a string, map of key value pairs, or json object of key value pairs returns a string
 * @param value
 */
function asString(value) {
    let retVal = value;
    if (value.entries) {
        // is map
        retVal = JSON.stringify(Object.fromEntries(value));
        return retVal;
    }
    else if (typeof value === "string") {
        // string
        // double check that it's valid json
        try {
            let asJSON = JSON.parse(value);
            retVal = value;
            return retVal;
        }
        catch (err) {
            throw new Error("not parsable json");
        }
    }
    else if (typeof value === 'object') {
        // serialized object
        retVal = JSON.stringify(value);
        return retVal;
    }
    return retVal;
}
/**
 * takes a array of entityId's, single string value of entityId, or comma delimited string of entityId's
 * and returns a json search compatible with the findNetwork method.
 * @param value
 * @returns json fragment of entityId's to use for findNetwork request
 */
function entityIdsAsJsonString(value) {
    let retVal = undefined;
    if (typeof value === "string") {
        // is string
        // check if they're already passing in '{"ENTITIES": [{"ENTITY_ID": number | string}]}'
        // a single entityId, or a comma-delimited list of entityId's
        let isJson = false;
        try {
            let asJSON = JSON.parse(value);
            isJson = (asJSON && asJSON["ENTITIES"] !== undefined);
        }
        catch (err) { }
        if (isJson) {
            // just pass as string
            retVal = value;
        }
        else {
            // check if it has a "comma"
            if (value.includes(",")) {
                // multiple entityId's
                let entitiesList = value.split(",").map((entityId) => {
                    return `{"ENTITY_ID": "${entityId}}"`;
                });
                retVal = `{"ENTITIES": [${entitiesList.join(',')}]}`;
            }
            else {
                // assume single entityId
                retVal = `{"ENTITIES": [ {"ENTITY_ID": ${value} }] }`;
            }
        }
    }
    else if (Array.isArray(value)) {
        // array of entity ids
        let entitiesList = value.map((entityId) => {
            return `{"ENTITY_ID": ${entityId}}`;
        });
        retVal = `{"ENTITIES": [${entitiesList.join(',')}]}`;
    }
    return retVal;
}
/** takes a array of [dataSourceCode, recordId] values and returns findNetwork compatible json string */
function recordIdsAsJsonString(values) {
    let retVal = "";
    if (Array.isArray(values)) {
        let identifiersList = values.map((recordKey) => {
            return `{"DATA_SOURCE": "${recordKey[0]}", "RECORD_ID": "${recordKey[1]}"}`;
        });
        retVal = `{"RECORDS": [${identifiersList.join(',')}]}`;
    }
    return retVal;
}
function requiredDataSourcesAsJson(values) {
    let retVal = `{"DATA_SOURCES": []}`;
    if (values && Array.isArray(values) && values.length > 0) {
        retVal = `{"DATA_SOURCES": [${values.map((dsVal) => { return '"' + dsVal + '"'; })}]}`;
    }
    return retVal;
}
function entityIdsToAvoidAsJson(values) {
    let retVal = `{"ENTITIES": []}`;
    if (values && Array.isArray(values) && values.length > 0) {
        let entityIds = values.map((entityId) => { return `{"ENTITY_ID": ${entityId}}`; });
        retVal = `{"ENTITIES": [${entityIds.join(",")}]}`;
    }
    return retVal;
}
function recordKeysToAvoidAsJson(values) {
    let retVal = `{"RECORDS": []}`;
    if (Array.isArray(values)) {
        let identifiersList = values.map((recordKey) => {
            return `{"DATA_SOURCE": "${recordKey[0]}", "RECORD_ID": ${recordKey[1]}})`;
        });
        retVal = `{"RECORDS": [${identifiersList.join(',')}]}`;
    }
    ;
    return retVal;
}
//# sourceMappingURL=szHelpers.js.map