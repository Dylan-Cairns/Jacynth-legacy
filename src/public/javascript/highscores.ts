import { MainMenuHandler, TabsHandler, populateTable } from './view/utils.js';

const mainMenuHandler = new MainMenuHandler(false, true);
const tabsHandler = new TabsHandler();

(async () => {
  try {
    const response = await fetch('/getSPHighScores');

    const SPgameData = await response.json();

    if (SPgameData) {
      // create sp game data table
      populateTable(SPgameData, 'SPGameRecords');

      document.getElementById('spinner')!.style.visibility = 'hidden';
      document.getElementById('loadScreen')!.classList.remove('active');
    }
  } catch (error) {
    console.log(error);
  }
})();

(async () => {
  try {
    const response = await fetch('/getMPHighScores');

    const MPgameData = await response.json();

    if (MPgameData) {
      // create sp game data table
      populateTable(MPgameData, 'MPGameRecords');

      document.getElementById('spinner')!.style.visibility = 'hidden';
      document.getElementById('loadScreen')!.classList.remove('active');
    }
  } catch (error) {
    console.log(error);
  }
})();
