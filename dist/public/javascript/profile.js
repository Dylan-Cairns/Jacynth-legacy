var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { MainMenuHandler } from './view/utils.js';
const mainMenuHandler = new MainMenuHandler(false, true);
// remove profile element on this page
document.getElementById('profile-button').remove();
function insertTableData(items, tableName) {
    const table = document.getElementById(tableName);
    const tBody = table.getElementsByTagName('tbody')[0];
    if (!table.tHead) {
        const header = table.createTHead();
        const tr = header.insertRow(0);
        Object.keys(items[0]).forEach((key) => {
            const th = document.createElement('th');
            th.innerHTML = key;
            tr.appendChild(th);
        });
    }
    items.forEach((item) => {
        const row = tBody.insertRow();
        Object.keys(item).forEach((key) => {
            const newRow = row.insertCell();
            // reformat ugly dates
            if (key === 'Date') {
                const date = new Date(item[key]);
                const string = convertDate(date);
                newRow.innerHTML = string;
            }
            else {
                newRow.innerHTML = item[key];
            }
            newRow.setAttribute('data-label', key);
        });
    });
}
function convertDate(dateObj) {
    const month = dateObj.getUTCMonth() + 1; //months from 1-12
    const day = dateObj.getUTCDate();
    const year = dateObj.getUTCFullYear();
    const newDate = year + '/' + month + '/' + day;
    return newDate;
}
(() => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const response = yield fetch('/getSPgameRecords');
        const SPgameData = yield response.json();
        const table = document.getElementById('SPGameRecords');
        if (SPgameData) {
            // create sp game data table
            insertTableData(SPgameData, 'SPGameRecords');
            const winsLosses = Object.entries(SPgameData.reduce((acc, ele) => {
                acc[ele['Result']] = acc[ele['Result']]
                    ? acc[ele['Result']] + 1
                    : 1;
                return acc;
            }, {}));
            const labels = [];
            const values = [];
            for (const [label, value] of winsLosses) {
                labels.push(label);
                values.push(value);
            }
            console.log(winsLosses);
            const data = [
                {
                    type: 'pie',
                    values: values,
                    labels: labels,
                    textinfo: 'label+percent',
                    insidetextorientation: 'radial',
                    automargin: true,
                    marker: {
                        colors: [
                            'rgb(56, 75, 126)',
                            'rgb(18, 36, 37)',
                            'rgb(34, 53, 101)',
                            'rgb(36, 55, 57)',
                            'rgb(6, 4, 4)'
                        ]
                    }
                }
            ];
            const layout = {
                margin: { t: 10, b: 10, l: 10, r: 10 },
                showlegend: false
            };
            const config = { responsive: true };
            Plotly.newPlot('spPieChart', data, layout, config);
            Plotly.newPlot('spPieChart2', data, layout, config);
            document.getElementById('spinner').style.visibility = 'hidden';
            document.getElementById('loadScreen').classList.remove('active');
        }
    }
    catch (error) {
        console.log(error);
    }
}))();
