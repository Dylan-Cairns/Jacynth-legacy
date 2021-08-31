import { MainMenuHandler } from './view/utils.js';
const mainMenuHandler = new MainMenuHandler(false, true);
// remove profile element on this page
document.getElementById('profile-button').remove();
// TO DO: update load screen to close after loading plotly and everything else
document.getElementById('spinner').style.visibility = 'hidden';
document.getElementById('loadScreen').classList.remove('active');
