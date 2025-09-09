export interface SzRecordIdentifierPair {
    "DATA_SOURCE": string;
    "RECORD_ID": string;
}
export interface SzGetVirtualEntityByRecordIdRequestParametersJson {
    "RECORDS": Array<SzRecordIdentifierPair>;
}
