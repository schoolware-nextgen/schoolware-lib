import axios, { AxiosInstance, AxiosResponse } from "axios";

type schoolwareDictionary = {
    [key: string]: string | number | boolean | Date;
}

export class Schoolware {
    username: string;
    password: string;
    token: string;
    domain: string;
    type



    constructor(username, password, domain = "kov.schoolware.be") {
        this.username = username;
        this.password = password;
        this.domain = "kov.schoolware.be";
    }
    async makeRequest(url: string): Promise<[AxiosResponse, boolean]> {
        let response = await axios.get(url, {
            headers: {
                'Cookie': `FPWebSession=${this.token}`,
            }
        })
        if (response.status == 200) {
            return [response, true]
        } else {
            return [response, false]
        }
    }

    async checkToken(): Promise<boolean> {
        let [response, succes] = await this.makeRequest(`https://${this.domain}/webleerling/bin/server.fcgi/REST/myschoolwareaccount`)
        if (succes) {
            return true;
        } else {
            return false;
        }

    }

    async tasks() {
        let [response, succes] = await this.makeRequest(`https://${this.domain}/webleerling/bin/server.fcgi/REST/AgendaPunt/?_dc=1665240724814&MinVan=${new Date()}&IsTaakOfToets=true`) //todo add .toISOString().split('T')[0] to date not for testing
        if (succes) {
            let rawArray = response.data.data;

            let tasksArray: schoolwareDictionary[] = []
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
                tasksArray.push({
                    "vak": element.VakNaam,
                    "title": element.Titel,
                    "type": type,
                    "comment": element.Commentaar,
                    "deadLine": new Date(element.Tot)
                })

            });
            return tasksArray
        }
    }

    async points() {
        let [response, succes] = await this.makeRequest(`https://${this.domain}/webleerling/bin/server.fcgi/REST/PuntenbladGridLeerling?BeoordelingMomentVan=1990-09-01+00:00:00`)
        if (succes) {
            let rawArray = response.data.data

            let pointsArray: schoolwareDictionary[] = []
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

                    pointsArray.push({
                        "vak": element.IngerichtVakNaamgebruiker,
                        "title": element.BeoordelingMomentOmschrijving,
                        "comment": comment,
                        "scoreFloat": score,
                        "scoreTotal": scoreTotal,
                        "dw": dw,
                        "date": new Date(element.BeoordelingMomentDatum)
                    })


                });
            });
            pointsArray.sort((a, b) => {
                const dateA = a.date as Date;
                const dateB = b.date as Date;
                return dateB.getTime() - dateA.getTime();
            });
            return pointsArray
        }
    }

    async agenda() {
        let start = new Date("2024-06-28T00:00:00.000Z")
        let end = new Date("2024-06-28T00:00:00.000Z");
        end.setDate(end.getDate() + 1);

        let [response, succes] = await this.makeRequest(`https://${this.domain}/webleerling/bin/server.fcgi/REST/AgendaPunt/?MaxVan=${end.toISOString().split('T')[0]}&MinTot=${start.toISOString().split('T')[0]}`)
        if (succes) {
            let rawAgenda = response.data.data

            let standardAgenda: schoolwareDictionary[] = []
            let titelAgenda: schoolwareDictionary[] = []

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
                    "period": periodCode
                }

                if (element.TypePunt == 1) {
                    standardAgenda.push(data);
                } else {
                    titelAgenda.push(data);
                }


            });
            const mergedArray = this.mergeArrays(standardAgenda, titelAgenda, "period");
            return mergedArray
        }
    }

    private createPriorityMap = (priority: schoolwareDictionary[], keyField: string): Map<string | number | boolean | Date, schoolwareDictionary> => {
        const map = new Map<string | number | boolean | Date, schoolwareDictionary>();
        for (const item of priority) {
          map.set(item[keyField], item);
        }
        return map;
      };
      
    private mergeArrays = (normal: schoolwareDictionary[], priority: schoolwareDictionary[], keyField: string): schoolwareDictionary[] => {
        const priorityMap = this.createPriorityMap(priority, keyField);
      
        const mergedArray: schoolwareDictionary[] = normal.map(item => {
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



