/** first re-export all the SzError types from the classes
 * we want users to reference this file and not the "SzErrorClasses" file.
*/
export * from './SzErrorClasses';
/**
 * @ignore
 */
export declare const ENGINE_EXCEPTION_MAP: Map<number, typeof import("./SzErrorClasses").SzBadInputError>;
