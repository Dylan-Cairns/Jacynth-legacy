import { MainMenuHandler, TabsHandler, populateTable } from './view/utils.js';

const mainMenuHandler = new MainMenuHandler(false);
const tabsHandler = new TabsHandler();

(async () => {
  let SPgameData;
  let MPgameData;

  try {
    const response = await fetch('/rest/getSPHighScores');
    SPgameData = await response.json();
  } catch (error) {
    console.log(error);
  }

  if (SPgameData.length > 0) {
    // create sp game data table
    populateTable(SPgameData, 'SPGameRecords');
  }

  try {
    const response = await fetch('/rest/getMPHighScores');

    MPgameData = await response.json();
  } catch (error) {
    console.log(error);
  }

  if (MPgameData.length > 0) {
    // create mp game data table
    populateTable(MPgameData, 'MPGameRecords');
  }

  document.getElementById('spinner')!.style.visibility = 'hidden';
  document.getElementById('loadScreen')!.classList.remove('active');
})();
