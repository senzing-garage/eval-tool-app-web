export interface ADD_DATASOURCE_RESPONSE {
    DSRC_ID: number;
}
export interface GET_DATASOURCES_RESPONSE {
    DATA_SOURCES: [{
        "DSRC_ID": number;
        "DSRC_CODE": string;
    }];
}
