import axios, { AxiosInstance, AxiosResponse } from "axios";

export class Schoolware {
    username: string;
    password: string;
    token: string;

    constructor(username, password) {
        this.username = username;
        this.password = password;
    }

    async getTokenSchoolware(): Promise<string> {
        let response = await axios.post("http://192.168.0.243:3000/token/schoolware", { "user": this.username, "password": this.password })
        this.token = response.data;
        return this.token;
    }
    async getTokenMicrosoft(): Promise<string> {
        let response = await axios.post("http://192.168.0.243:3000/token/microsoft", { "user": this.username, "password": this.password })
        this.token = response.data;
        return this.token;
    }
    async makeRequest(url: string): Promise<AxiosResponse> {
        return await axios.get(url, {
            headers: {
                'Cookie': `FPWebSession=${this.token}`,
            }
        })
    }

    async checkToken(): Promise<boolean> {
        let response = await this.makeRequest("https://kov.schoolware.be/webleerling/bin/server.fcgi/REST/myschoolwareaccount")
        if (response.status == 200) {
            return true;
        } else {
            return false;
        }

    }
}



