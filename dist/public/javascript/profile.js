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
const tabs = document.querySelectorAll('[data-tab-target]');
const tabContents = document.querySelectorAll('[data-tab-content]');
tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
        const target = document.querySelector(tab.dataset.tabTarget);
        tabContents.forEach((tabContent) => {
            tabContent.classList.remove('active');
        });
        tabs.forEach((tab) => {
            tab.classList.remove('active');
        });
        tab.classList.add('active');
        target.classList.add('active');
    });
});
// // remove profile element on this page
// document.getElementById('profile-button')!.remove();
function populateTable(items, tableName) {
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
function getHighScore(records) {
    return records.reduce((acc, row) => {
        acc = row['Your Score'] > acc ? row['Your Score'] : acc;
        return acc;
    }, 0);
}
function getWinningStreak(records) {
    let winningStreak = 0;
    let localSum = 0;
    for (let idx = 0; idx < records.length; idx++) {
        if (records[idx]['Result'] === 'Won') {
            localSum++;
        }
        else {
            localSum = 0;
        }
        winningStreak = localSum > winningStreak ? localSum : winningStreak;
    }
    return winningStreak;
}
function getWinsLosses(records) {
    return records.reduce((acc, ele) => {
        acc[ele['Result']] = acc[ele['Result']] ? acc[ele['Result']] + 1 : 1;
        return acc;
    }, new Map());
}
(() => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const response = yield fetch('/getSPgameRecords');
        const SPgameData = yield response.json();
        if (SPgameData) {
            // create sp game data table
            populateTable(SPgameData, 'SPGameRecords');
            const spHighScore = getHighScore(SPgameData);
            const spHighScoreDiv = document.getElementById('spHighScore');
            if (spHighScoreDiv)
                spHighScoreDiv.innerHTML += spHighScore;
            const spWinningStreak = getWinningStreak(SPgameData);
            const spStreakDiv = document.getElementById('spStreak');
            if (spStreakDiv)
                spStreakDiv.innerHTML += spWinningStreak;
            const winsLosses = getWinsLosses(SPgameData);
            const pieChartLabels = Object.keys(winsLosses);
            const pieChartValues = Object.values(winsLosses);
            const pieChartData = [
                {
                    type: 'pie',
                    values: pieChartValues,
                    labels: pieChartLabels,
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
            const pieChartLayout = {
                title: 'Wins/Losses',
                showlegend: false
            };
            const pieChartConfig = { responsive: true };
            Plotly.newPlot('spPieChart', pieChartData, pieChartLayout, pieChartConfig);
            const spPlayerScores = [];
            const spOpponentScores = [];
            const spGameNumber = [];
            SPgameData.forEach((row) => {
                spPlayerScores.push(row['Your Score']);
                spOpponentScores.push(row['Opponent Score']);
                spGameNumber.push(row['#']);
            });
            const trace1 = {
                x: spGameNumber,
                y: spPlayerScores,
                name: 'You',
                type: 'bar'
            };
            const trace2 = {
                x: spGameNumber,
                y: spOpponentScores,
                name: 'Opponent',
                type: 'bar'
            };
            const data = [trace1, trace2];
            Plotly.newPlot('spPieChart2', data, {
                title: 'Scores',
                xaxis: { title: 'Game #' },
                yaxis: {
                    title: 'Points'
                },
                barmode: 'group'
            }, { responsive: true });
            document.getElementById('spinner').style.visibility = 'hidden';
            document.getElementById('loadScreen').classList.remove('active');
        }
    }
    catch (error) {
        console.log(error);
    }
}))();
(() => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const response = yield fetch('/getMPgameRecords');
        const MPgameData = yield response.json();
        if (MPgameData) {
            // create sp game data table
            populateTable(MPgameData, 'MPGameRecords');
            const mpHighScore = getHighScore(MPgameData);
            const mpHighScoreDiv = document.getElementById('mpHighScore');
            if (mpHighScoreDiv)
                mpHighScoreDiv.innerHTML += mpHighScore;
            const mpWinningStreak = getWinningStreak(MPgameData);
            const mpStreakDiv = document.getElementById('mpStreak');
            if (mpStreakDiv)
                mpStreakDiv.innerHTML += mpWinningStreak;
            const winsLosses = getWinsLosses(MPgameData);
            const pieChartLabels = Object.keys(winsLosses);
            const pieChartValues = Object.values(winsLosses);
            const pieChartData = [
                {
                    type: 'pie',
                    values: pieChartValues,
                    labels: pieChartLabels,
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
            const pieChartLayout = {
                title: 'Wins/Losses',
                showlegend: false
            };
            const pieChartConfig = { responsive: true };
            Plotly.newPlot('mpPieChart', pieChartData, pieChartLayout, pieChartConfig);
            const mpPlayerScores = [];
            const mpOpponentScores = [];
            const mpGameNumber = [];
            MPgameData.forEach((row) => {
                mpPlayerScores.push(row['Your Score']);
                mpOpponentScores.push(row['Opponent Score']);
                mpGameNumber.push(row['#']);
            });
            const trace1 = {
                x: mpGameNumber,
                y: mpPlayerScores,
                name: 'You',
                type: 'bar'
            };
            const trace2 = {
                x: mpGameNumber,
                y: mpOpponentScores,
                name: 'Opponent',
                type: 'bar'
            };
            const data = [trace1, trace2];
            Plotly.newPlot('mpPieChart2', data, {
                title: 'Scores',
                xaxis: { title: 'Game #' },
                yaxis: {
                    title: 'Points'
                },
                barmode: 'group'
            }, { responsive: true });
            document.getElementById('spinner').style.visibility = 'hidden';
            document.getElementById('loadScreen').classList.remove('active');
        }
    }
    catch (error) {
        console.log(error);
    }
}))();
