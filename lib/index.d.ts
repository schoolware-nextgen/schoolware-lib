import { AxiosResponse } from "axios";
type tasksDict = {
    vak: string;
    title: string;
    type: string;
    comment: string;
    deadline: Date;
};
type pointsDict = {
    vak: string;
    title: string;
    comment: string;
    scoreFloat: number;
    scoreTotal: number;
    dw: string;
    date: Date;
    type: string;
};
type agendaDict = {
    vak: String;
    room: String;
    title: String;
    comment: String;
    date: Date;
    period: number;
};
export declare class Schoolware {
    username: string;
    password: string;
    token: string;
    domain: string;
    constructor(username?: string, password?: string, domain?: string);
    getTokenSchoolware(): Promise<string>;
    getTokenMicrosoft(): Promise<string>;
    makeRequest(url: string, token?: string): Promise<[AxiosResponse, boolean]>;
    checkToken(): Promise<boolean>;
    tasks(): Promise<tasksDict[]>;
    points(): Promise<pointsDict[]>;
    agenda(date?: Date): Promise<agendaDict[]>;
    private createPriorityMap;
    private mergeArrays;
}
export { agendaDict, pointsDict, tasksDict };
