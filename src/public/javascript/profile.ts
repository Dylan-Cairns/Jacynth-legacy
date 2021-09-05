import { MainMenuHandler, TabsHandler, populateTable } from './view/utils.js';

const mainMenuHandler = new MainMenuHandler(false, true);
const tabsHandler = new TabsHandler();

declare class Plotly {
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  constructor(data: any);
  static newPlot(arg0: string, data: any, layout: any, config: any): any;
}

// // remove profile element on this page
// document.getElementById('profile-button')!.remove();

function getHighScore(records: Record<string, number>[]) {
  return records.reduce((acc: number, row: Record<string, number>) => {
    acc = row['Your Score'] > acc ? row['Your Score'] : acc;
    return acc;
  }, 0);
}

function getWinningStreak(records: Record<string, string>[]) {
  let winningStreak = 0;
  let localSum = 0;

  for (let idx = 0; idx < records.length; idx++) {
    if (records[idx]['Result'] === 'Won') {
      localSum++;
    } else {
      localSum = 0;
    }
    winningStreak = localSum > winningStreak ? localSum : winningStreak;
  }

  return winningStreak;
}

function getWinsLosses(records: any): Map<string, number> {
  return records.reduce(
    (acc: Record<string, number>, ele: Record<string, string>) => {
      acc[ele['Result']] = acc[ele['Result']] ? acc[ele['Result']] + 1 : 1;
      return acc;
    },
    new Map()
  );
}

(async () => {
  try {
    const response = await fetch('/getSPGameRecords');

    const SPgameData = await response.json();

    if (SPgameData) {
      // create sp game data table
      populateTable(SPgameData, 'SPGameRecords');

      const spHighScore = getHighScore(SPgameData);
      const spHighScoreDiv = document.getElementById('spHighScore');
      if (spHighScoreDiv) spHighScoreDiv.innerHTML += spHighScore;

      const spWinningStreak = getWinningStreak(SPgameData);
      const spStreakDiv = document.getElementById('spStreak');
      if (spStreakDiv) spStreakDiv.innerHTML += spWinningStreak;

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
      ] as any;

      const pieChartLayout = {
        title: 'Wins/Losses',
        showlegend: false
      };

      const pieChartConfig = { responsive: true };

      Plotly.newPlot(
        'spPieChart',
        pieChartData,
        pieChartLayout,
        pieChartConfig
      );

      const spPlayerScores = [] as number[];
      const spOpponentScores = [] as number[];
      const spGameNumber = [] as number[];
      SPgameData.forEach((row: any) => {
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

      Plotly.newPlot(
        'spPieChart2',
        data,
        {
          title: 'Scores',
          xaxis: { title: 'Game #' },
          yaxis: {
            title: 'Points'
          },
          barmode: 'group'
        },
        { responsive: true }
      );

      document.getElementById('spinner')!.style.visibility = 'hidden';
      document.getElementById('loadScreen')!.classList.remove('active');
    }
  } catch (error) {
    console.log(error);
  }
})();

(async () => {
  try {
    const response = await fetch('/getMPGameRecords');

    const MPgameData = await response.json();

    if (MPgameData) {
      // create sp game data table
      populateTable(MPgameData, 'MPGameRecords');

      const mpHighScore = getHighScore(MPgameData);
      const mpHighScoreDiv = document.getElementById('mpHighScore');
      if (mpHighScoreDiv) mpHighScoreDiv.innerHTML += mpHighScore;

      const mpWinningStreak = getWinningStreak(MPgameData);
      const mpStreakDiv = document.getElementById('mpStreak');
      if (mpStreakDiv) mpStreakDiv.innerHTML += mpWinningStreak;

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
      ] as any;

      const pieChartLayout = {
        title: 'Wins/Losses',
        showlegend: false
      };

      const pieChartConfig = { responsive: true };

      Plotly.newPlot(
        'mpPieChart',
        pieChartData,
        pieChartLayout,
        pieChartConfig
      );

      const mpPlayerScores = [] as number[];
      const mpOpponentScores = [] as number[];
      const mpGameNumber = [] as number[];
      MPgameData.forEach((row: any) => {
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

      Plotly.newPlot(
        'mpPieChart2',
        data,
        {
          title: 'Scores',
          xaxis: { title: 'Game #' },
          yaxis: {
            title: 'Points'
          },
          barmode: 'group'
        },
        { responsive: true }
      );

      // Remove active class from multiplayer grid container to set it's display to none.
      // Initially loading the page without the active class will cause plotly
      // To render the charts at an incorrect size.
      document.getElementById('mpGridContainer')?.classList.remove('active');
      document.getElementById('spinner')!.style.visibility = 'hidden';
      document.getElementById('loadScreen')!.classList.remove('active');
    }
  } catch (error) {
    console.log(error);
  }
})();
