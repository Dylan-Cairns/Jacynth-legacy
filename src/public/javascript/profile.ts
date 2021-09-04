import { MainMenuHandler } from './view/utils.js';

const mainMenuHandler = new MainMenuHandler(false, true);

declare class Plotly {
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  constructor(data: any);
  static newPlot(arg0: string, data: any, layout: any, config: any): any;
}

// remove profile element on this page
document.getElementById('profile-button')!.remove();

function insertTableData(items: [Record<string, string>], tableName: string) {
  const table = document.getElementById(tableName) as HTMLTableElement;
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

  items.forEach((item: Record<string, string>) => {
    const row = tBody.insertRow();
    Object.keys(item).forEach((key) => {
      const newRow = row.insertCell();
      // reformat ugly dates
      if (key === 'Date') {
        const date = new Date(item[key]);
        const string = convertDate(date);
        newRow.innerHTML = string;
      } else {
        newRow.innerHTML = item[key];
      }
      newRow.setAttribute('data-label', key);
    });
  });
}

function convertDate(dateObj: Date) {
  const month = dateObj.getUTCMonth() + 1; //months from 1-12
  const day = dateObj.getUTCDate();
  const year = dateObj.getUTCFullYear();
  const newDate = year + '/' + month + '/' + day;
  return newDate;
}

(async () => {
  try {
    const response = await fetch('/getSPgameRecords');

    const SPgameData = await response.json();

    const table = document.getElementById('SPGameRecords');

    if (SPgameData) {
      // create sp game data table
      insertTableData(SPgameData, 'SPGameRecords');

      const winsLosses = Object.entries(
        SPgameData.reduce(
          (acc: Record<string, number>, ele: Record<string, string>) => {
            acc[ele['Result']] = acc[ele['Result']]
              ? acc[ele['Result']] + 1
              : 1;
            return acc;
          },
          {}
        )
      ) as [[string, number]];
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
      ] as any;

      const layout = {
        margin: { t: 10, b: 10, l: 10, r: 10 },
        showlegend: false
      };

      const config = { responsive: true };

      Plotly.newPlot('spPieChart', data, layout, config);

      Plotly.newPlot('spPieChart2', data, layout, config);

      document.getElementById('spinner')!.style.visibility = 'hidden';
      document.getElementById('loadScreen')!.classList.remove('active');
    }
  } catch (error) {
    console.log(error);
  }
})();
