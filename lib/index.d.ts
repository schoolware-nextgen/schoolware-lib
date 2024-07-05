import { AxiosResponse } from "axios";
export declare class Schoolware {
    username: string;
    password: string;
    token: string;
    constructor(username: any, password: any);
    getTokenSchoolware(): Promise<string>;
    getTokenMicrosoft(): Promise<string>;
    makeRequest(url: string): Promise<AxiosResponse>;
    checkToken(): Promise<boolean>;
}
