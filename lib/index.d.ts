import { AxiosResponse } from "axios";
type schoolwareDictionary = {
    [key: string]: string | number | boolean | Date;
};
export declare class Schoolware {
    username: string;
    password: string;
    token: string;
    domain: string;
    type: any;
    constructor(username: any, password: any, domain?: string);
    getTokenSchoolware(): Promise<string>;
    getTokenMicrosoft(): Promise<string>;
    makeRequest(url: string): Promise<[AxiosResponse, boolean]>;
    checkToken(): Promise<boolean>;
    tasks(): Promise<schoolwareDictionary[]>;
    points(): Promise<schoolwareDictionary[]>;
    agenda(): Promise<schoolwareDictionary[]>;
    private createPriorityMap;
    private mergeArrays;
}
export {};
