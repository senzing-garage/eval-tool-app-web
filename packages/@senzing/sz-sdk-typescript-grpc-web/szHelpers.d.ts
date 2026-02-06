import * as grpcweb from 'grpc-web';
import * as grpc from '@grpc/grpc-js';
import { SzError } from './senzing/SzError';
export declare function getSenzingErrorCode(error: string): number;
/**
 * The other language implementations take an ServiceError object and pull details out of the object
 * but due to the ... non-uniform shape of the two different grpc packages implementations the static
 * analysis complains. the simple solution is to just pull the details out of the error obj
 * BEFORE it gets to the helper sig to avoid type collision issues.
 * @returns
 */
export declare function newException(error: grpc.ServiceError | grpcweb.RpcError): SzError;
/** The SzEngineFlags values are all big int or bitwise operations on bigInt
 * so just casting them to numbers doesn't work due to some values being bitwise ops on
 * long numbers. the casting needs to be done inside the methods handing values to the engine.
*/
export declare function bigIntToNumber(value: BigInt | number): number;
/**
 * Given a string, map of key value pairs, or json object of key value pairs returns a string
 * @param value
 */
export declare function asString(value: string | Map<any, any> | {
    [key: string]: any;
}): string;
/**
 * takes a array of entityId's, single string value of entityId, or comma delimited string of entityId's
 * and returns a json search compatible with the findNetwork method.
 * @param value
 * @returns json fragment of entityId's to use for findNetwork request
 */
export declare function entityIdsAsJsonString(value: string | Array<number | string>): string | undefined;
/** takes a array of [dataSourceCode, recordId] values and returns findNetwork compatible json string */
export declare function recordIdsAsJsonString(values: Array<[string, string | number]>): string;
export declare function requiredDataSourcesAsJson(values: Array<string>): string;
export declare function entityIdsToAvoidAsJson(values: Array<number>): string;
export declare function recordKeysToAvoidAsJson(values: Array<[string, string | number]>): string;
