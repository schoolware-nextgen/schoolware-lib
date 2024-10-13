import { chromium } from 'playwright';

type tasksDict = {
    vak: string,
    title: string,
    type: string,
    comment: string,
    deadline: Date
}

type pointsDict = {
    vak: string,
    title: string,
    comment: string,
    scoreFloat: number,
    scoreTotal: number,
    dw: string,
    date: Date,
    type: string,
    gewicht: number
}

type agendaDict = {
    vak: String,
    room: String,
    title: String,
    comment: String,
    date: Date,
    period: number
}

type berichtenDict = {
    titel: String,
    bericht: String,
    date: Date
}

export class Schoolware {
    username: string;
    password: string;
    token: string;
    domain: string;



    constructor(username = "", password = "", domain = "kov.schoolware.be") {
        this.username = username;
        this.password = password;
        this.domain = domain;
    }

    async getTokenSchoolware(): Promise<[string, boolean, number]> {

        if (typeof (this.username) != 'string' || typeof (this.password) != 'string') {
            console.log(`set username and password`);

            return ["", false, 400];
        }
        let url = `https://${this.domain}/webleerling/bin/server.fcgi/RPC/ROUTER/`;

        let options = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: `{"action":"WisaUserAPI","method":"Authenticate","data":["${this.username}","${this.password}"],"type":"rpc","tid":1}`
        };

        const response = await fetch(url, options)
        if (response.status == 200) {
            let cookie = response.headers.getSetCookie()[0].split(";")[0].split("=")[1];
            this.token = cookie;
            return [cookie, true, response.status];
        } else {
            return ["", false, response.status];
        }


    }

    async getTokenMicrosoft(): Promise<[string, boolean, number]> {
        if (typeof (this.username) != 'string' || typeof (this.password) != 'string') {
            console.log(`send user and password`);
            return ["", false, 400];
        }
        const browser = await chromium.launch();
        const context = await browser.newContext({
            userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:108.0) Gecko/20100101 Firefox/108.0"
        })
        context.setDefaultTimeout(25000);
        const page = await context.newPage()
        try {
            await page.goto(`https://${this.domain}/webleerling/start.html#!fn=llagenda`);
            await page.locator("#ext-comp-1014-btnEl").click()
            await page.getByRole("textbox").fill(this.username)
            await page.getByText("Next").click()
            await page.getByPlaceholder("Password").fill(this.password)
            await page.getByText("Sign In").click()
            await page.waitForLoadState()
            let cookies = await context.cookies(`https://${this.domain}`);
            await context.close();
            await browser.close();
            this.token = cookies[0].value;
            return [cookies[0].value, true, 200];
        } catch (err) {
            console.log(err);
            await context.close();
            await browser.close();
            return ["", false, 500];
        }
    }




    async makeRequest(url: string, token: string = undefined) {
        return await fetch(url, {
            headers: {
                'Cookie': `FPWebSession=${token ? token : this.token}`,
            }
        }).then(async response => {
            if (response.status == 200) {
                let data = await response.json();
                return [data, true, response.status];
            } else {
                return [{}, false, response.status]
            }
        })
            .catch(error => {
                console.log(error);
                return [{}, false, error.status]
            })


    }

    async checkToken(): Promise<[boolean, number]> {
        try {
            var [response, success, status] = await this.makeRequest(`https://${this.domain}/webleerling/bin/server.fcgi/REST/myschoolwareaccount`)
        }
        catch (err) {
            return [false, status];
        }
        if (success) {
            return [true, status];
        } else {
            return [false, status];
        }

    }

    async tasks(): Promise<[tasksDict[], boolean, number]> {
        let [response, success, status] = await this.makeRequest(`https://${this.domain}/webleerling/bin/server.fcgi/REST/AgendaPunt/?_dc=1665240724814&MinVan=${new Date().toISOString().split('T')[0]}&IsTaakOfToets=true`) //todo add .toISOString().split('T')[0] to date not for testing
        if (success) {
            let rawArray = response.data;

            let tasksArray: tasksDict[] = [{
                vak: "",
                title: "",
                type: "",
                comment: "",
                deadline: new Date()
            }]
            rawArray.forEach(element => {

                switch (element.TypePunt) {
                    case 1000:
                        var type: string = "taak";
                        break;
                    case 100:
                        var type: string = "toets";
                        break;
                    case 101:
                        var type: string = "hertoets";
                        break;
                }
                let vak: string = element.VakNaam
                let title: string = element.Titel
                let comment: string = element.Commentaar

                tasksArray.push({
                    "vak": vak,
                    "title": title,
                    "type": type,
                    "comment": comment,
                    "deadline": new Date(element.Tot)
                })

            });
            return [tasksArray, success, status]
        } else {
            let tasksArray: tasksDict[] = [{
                "vak": "",
                title: "",
                type: "",
                comment: "",
                deadline: new Date()
            }]
            return [tasksArray, success, status]
        }

    }

    async points(): Promise<[pointsDict[], boolean, number]> {
        let [response, success, status] = await this.makeRequest(`https://${this.domain}/webleerling/bin/server.fcgi/REST/PuntenbladGridLeerling?BeoordelingMomentVan=1990-09-01+00:00:00`)
        if (success) {
            let rawArray = response.data

            let pointsArray: pointsDict[] = []
            rawArray.forEach(vak => {
                vak.Beoordelingen.forEach(element => {
                    if ("BeoordelingWaarde" in element) {
                        var score = element.BeoordelingWaarde.NumeriekAsString
                        if (typeof (score) == "string" && score != "") {
                            score = parseFloat(score)
                        } else { score = "/" }

                        var scoreTotal = element.BeoordelingMomentNoemer
                        if (typeof (scoreTotal) != "number") {
                            scoreTotal = "/"
                        }

                        var comment = element.BeoordelingWaarde.Commentaar
                    } else {
                        score = "/"
                        scoreTotal = "/"
                        comment = "/"
                    }

                    if ("DagelijksWerkCode" in element) {
                        var dw: string = element.DagelijksWerkCode
                    } else { var dw: string = "exam" }

                    let type = element.BeoordelingMomentType_;
                    if (type == "bmtTaak") {
                        type = "taak"
                    }
                    else {
                        type = "toets"
                    }

                    if (element.hasOwnProperty("BeoordelingMomentCategorieGewicht")) {
                        var gewicht = element.BeoordelingMomentCategorieGewicht;
                    } else {
                        gewicht = 0;
                    }

                    pointsArray.push({
                        "vak": element.IngerichtVakNaamgebruiker,
                        "title": element.BeoordelingMomentOmschrijving,
                        "comment": comment,
                        "scoreFloat": score,
                        "scoreTotal": scoreTotal,
                        "dw": dw,
                        "date": new Date(element.BeoordelingMomentDatum),
                        "type": type,
                        "gewicht": gewicht
                    })


                });
            });
            pointsArray.sort((a, b) => {
                const dateA = a.date as Date;
                const dateB = b.date as Date;
                return dateB.getTime() - dateA.getTime();
            });
            return [pointsArray, success, status]
        } else {
            let pointsArray: pointsDict[] = []
            return [pointsArray, success, status]
        }
    }

    async agenda(date: Date = new Date()): Promise<[agendaDict[], boolean, number]> {
        let start = new Date(date)
        let end = new Date(date);
        end.setDate(end.getDate() + 1);

        let [response, success, status] = await this.makeRequest(`https://${this.domain}/webleerling/bin/server.fcgi/REST/AgendaPunt/?MaxVan=${end.toISOString().split('T')[0]}&MinTot=${start.toISOString().split('T')[0]}`)
        if (success) {
            let rawAgenda = response.data

            let standardAgenda: agendaDict[] = []
            let titelAgenda: agendaDict[] = []

            rawAgenda.forEach(element => {
                var period = new Date(element.Van)
                let hour = period.getHours()
                let minutes = period.getMinutes()
                switch (`${hour}-${minutes}`) {
                    case ("8-25"):
                        var periodCode = 1
                        break;
                    case ("9-15"):
                        var periodCode = 2
                        break;
                    case ("10-20"):
                        var periodCode = 3
                        break;
                    case ("11-10"):
                        var periodCode = 4
                        break;
                    case ("12-55"):
                        var periodCode = 5
                        break;
                    case ("13-45"):
                        var periodCode = 6
                        break;
                    case ("14-50"):
                        var periodCode = 7
                        break;
                    case ("15-40"):
                        var periodCode = 8
                        break;
                }

                let data = {
                    "vak": element.VakNaam,
                    "room": element.LokaalCode,
                    "title": element.Titel,
                    "comment": element.Commentaar,
                    "date": new Date(element.Van),
                    "period": periodCode,
                    "van": new Date(element.Van),
                    "tot": new Date(element.Tot)
                }

                if (element.TypePunt == 1) {
                    standardAgenda.push(data);
                } else {
                    titelAgenda.push(data);
                }


            });
            const mergedArray = this.mergeArrays(standardAgenda, titelAgenda, "period");
            return [mergedArray, success, status]
        } else {
            console.log(`ERROR: agend ${response}`);
            let standardAgenda: agendaDict[] = []
            return [standardAgenda, success, status]
        }
    }

    async berichten() {
        let [response, success, status] = await this.makeRequest(`https://${this.domain}/webleerling/bin/server.fcgi/REST/WebsiteBericht?MAXVAN=TOMORROW&MINTOT=TODAY&sort=starred%20desc%2C%20van%20desc`)
        let berichten: berichtenDict[] = [];
        if (success) {
            response.data.forEach((element) => {
                berichten.push({
                    titel: element.Titel,
                    bericht: element.Bericht,
                    date: new Date(element.CreatedOn)
                })
            })
            return [berichten, success, status]
        }
        else {
            console.log(`ERROR: berichten ${response}`);
            return [berichten, success, status]
        }

    }

    private createPriorityMap = (priority: agendaDict[], keyField: string): Map<string | number | boolean | Date, agendaDict> => {
        const map = new Map<string | number | boolean | Date, agendaDict>();
        for (const item of priority) {
            map.set(item[keyField], item);
        }
        return map;
    };

    private mergeArrays = (normal: agendaDict[], priority: agendaDict[], keyField: string): agendaDict[] => {
        const priorityMap = this.createPriorityMap(priority, keyField);

        const mergedArray: agendaDict[] = normal.map(item => {
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

}

export { agendaDict, pointsDict, tasksDict }



