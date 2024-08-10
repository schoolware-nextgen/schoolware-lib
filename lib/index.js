"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Schoolware = void 0;
const axios_1 = __importDefault(require("axios"));
const playwright_1 = require("playwright");
class Schoolware {
    constructor(username = "", password = "", domain = "kov.schoolware.be") {
        this.createPriorityMap = (priority, keyField) => {
            const map = new Map();
            for (const item of priority) {
                map.set(item[keyField], item);
            }
            return map;
        };
        this.mergeArrays = (normal, priority, keyField) => {
            const priorityMap = this.createPriorityMap(priority, keyField);
            const mergedArray = normal.map(item => {
                const priorityItem = priorityMap.get(item[keyField]);
                return priorityItem || item;
            });
            for (const item of priority) {
                if (!normal.some(normalItem => normalItem[keyField] === item[keyField])) {
                    mergedArray.push(item);
                }
            }
            return mergedArray;
        };
        this.username = username;
        this.password = password;
        this.domain = domain;
    }
    getTokenSchoolware() {
        return __awaiter(this, void 0, void 0, function* () {
            if (typeof (this.username) != 'string' || typeof (this.password) != 'string') {
                console.log(`set username and password`);
                return;
            }
            let url = 'https://kov.schoolware.be/webleerling/bin/server.fcgi/RPC/ROUTER/';
            let options = {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: `{"action":"WisaUserAPI","method":"Authenticate","data":["${this.username}","${this.password}"],"type":"rpc","tid":1}`
            };
            const response = yield fetch(url, options);
            let cookie = response.headers.getSetCookie()[0].split(";")[0].split("=")[1];
            this.token = cookie;
            return cookie;
        });
    }
    getTokenMicrosoft() {
        return __awaiter(this, void 0, void 0, function* () {
            if (typeof (this.username) != 'string' || typeof (this.password) != 'string') {
                console.log(`send user and password`);
                return;
            }
            const browser = yield playwright_1.chromium.launch();
            const context = yield browser.newContext({
                userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:108.0) Gecko/20100101 Firefox/108.0"
            });
            yield context.setDefaultTimeout(25000);
            const page = yield context.newPage();
            try {
                yield page.goto('https://kov.schoolware.be/webleerling/start.html#!fn=llagenda');
                yield page.locator("#ext-comp-1014-btnEl").click();
                yield page.getByRole("textbox").fill(this.username);
                yield page.getByText("Next").click();
                yield page.getByPlaceholder("Password").fill(this.password);
                yield page.getByText("Sign In").click();
                yield page.waitForLoadState();
                let cookies = yield context.cookies("https://kov.schoolware.be");
                yield context.close();
                yield browser.close();
                this.token = cookies[0].value;
                return cookies[0].value;
            }
            catch (err) {
                console.log(err);
                yield context.close();
                yield browser.close();
            }
        });
    }
    makeRequest(url_1) {
        return __awaiter(this, arguments, void 0, function* (url, token = undefined) {
            let response = yield axios_1.default.get(url, {
                headers: {
                    'Cookie': `FPWebSession=${token ? token : this.token}`,
                }
            });
            if (response.status == 200) {
                return [response, true];
            }
            else {
                return [response, false];
            }
        });
    }
    checkToken() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                var [response, succes] = yield this.makeRequest(`https://${this.domain}/webleerling/bin/server.fcgi/REST/myschoolwareaccount`);
            }
            catch (err) {
                return false;
            }
            if (succes) {
                return true;
            }
            else {
                return false;
            }
        });
    }
    tasks() {
        return __awaiter(this, void 0, void 0, function* () {
            let [response, succes] = yield this.makeRequest(`https://${this.domain}/webleerling/bin/server.fcgi/REST/AgendaPunt/?_dc=1665240724814&MinVan=${new Date().toISOString().split('T')[0]}&IsTaakOfToets=true`); //todo add .toISOString().split('T')[0] to date not for testing
            if (succes) {
                let rawArray = response.data.data;
                let tasksArray = [{
                        "vak": "",
                        title: "",
                        type: "",
                        comment: "",
                        deadline: new Date()
                    }];
                rawArray.forEach(element => {
                    switch (element.TypePunt) {
                        case 1000:
                            var type = "taak";
                            break;
                        case 100:
                            var type = "toets";
                            break;
                        case 101:
                            var type = "hertoets";
                            break;
                    }
                    let vak = element.VakNaam;
                    let title = element.Titel;
                    let comment = element.Commentaar;
                    tasksArray.push({
                        "vak": vak,
                        "title": title,
                        "type": type,
                        "comment": comment,
                        "deadline": new Date(element.Tot)
                    });
                });
                return tasksArray;
            }
        });
    }
    points() {
        return __awaiter(this, void 0, void 0, function* () {
            let [response, succes] = yield this.makeRequest(`https://${this.domain}/webleerling/bin/server.fcgi/REST/PuntenbladGridLeerling?BeoordelingMomentVan=1990-09-01+00:00:00`);
            if (succes) {
                let rawArray = response.data.data;
                let pointsArray = [];
                rawArray.forEach(vak => {
                    vak.Beoordelingen.forEach(element => {
                        if ("BeoordelingWaarde" in element) {
                            var score = element.BeoordelingWaarde.NumeriekAsString;
                            if (typeof (score) == "string" && score != "") {
                                score = parseFloat(score);
                            }
                            else {
                                score = "/";
                            }
                            var scoreTotal = element.BeoordelingMomentNoemer;
                            if (typeof (scoreTotal) != "number") {
                                scoreTotal = "/";
                            }
                            var comment = element.BeoordelingWaarde.Commentaar;
                        }
                        else {
                            score = "/";
                            scoreTotal = "/";
                            comment = "/";
                        }
                        if ("DagelijksWerkCode" in element) {
                            var dw = element.DagelijksWerkCode;
                        }
                        else {
                            var dw = "exam";
                        }
                        let type = element.BeoordelingMomentType_;
                        if (type == "bmtTaak") {
                            type = "taak";
                        }
                        else {
                            type = "toets";
                        }
                        pointsArray.push({
                            "vak": element.IngerichtVakNaamgebruiker,
                            "title": element.BeoordelingMomentOmschrijving,
                            "comment": comment,
                            "scoreFloat": score,
                            "scoreTotal": scoreTotal,
                            "dw": dw,
                            "date": new Date(element.BeoordelingMomentDatum),
                            "type": type
                        });
                    });
                });
                pointsArray.sort((a, b) => {
                    const dateA = a.date;
                    const dateB = b.date;
                    return dateB.getTime() - dateA.getTime();
                });
                return pointsArray;
            }
        });
    }
    agenda() {
        return __awaiter(this, arguments, void 0, function* (date = new Date()) {
            let start = new Date(date);
            let end = new Date(date);
            end.setDate(end.getDate() + 1);
            let [response, succes] = yield this.makeRequest(`https://${this.domain}/webleerling/bin/server.fcgi/REST/AgendaPunt/?MaxVan=${end.toISOString().split('T')[0]}&MinTot=${start.toISOString().split('T')[0]}`);
            if (succes) {
                let rawAgenda = response.data.data;
                let standardAgenda = [];
                let titelAgenda = [];
                rawAgenda.forEach(element => {
                    var period = new Date(element.Van);
                    let hour = period.getHours();
                    let minutes = period.getMinutes();
                    switch (`${hour}-${minutes}`) {
                        case ("8-25"):
                            var periodCode = 1;
                            break;
                        case ("9-15"):
                            var periodCode = 2;
                            break;
                        case ("10-20"):
                            var periodCode = 3;
                            break;
                        case ("11-10"):
                            var periodCode = 4;
                            break;
                        case ("12-55"):
                            var periodCode = 5;
                            break;
                        case ("13-45"):
                            var periodCode = 6;
                            break;
                        case ("14-50"):
                            var periodCode = 7;
                            break;
                        case ("15-40"):
                            var periodCode = 8;
                            break;
                    }
                    let data = {
                        "vak": element.VakNaam,
                        "room": element.LokaalCode,
                        "title": element.Titel,
                        "comment": element.Commentaar,
                        "date": new Date(element.Van),
                        "period": periodCode
                    };
                    if (element.TypePunt == 1) {
                        standardAgenda.push(data);
                    }
                    else {
                        titelAgenda.push(data);
                    }
                });
                const mergedArray = this.mergeArrays(standardAgenda, titelAgenda, "period");
                return mergedArray;
            }
        });
    }
}
exports.Schoolware = Schoolware;
