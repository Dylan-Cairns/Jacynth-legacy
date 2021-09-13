import { MainMenuHandler } from './view/utils.js';
// disable bfcache to force the page to reload every time,
// even when visited from back button. This is to
// Ensure that the single player resume button displays
// at the correct times.
// relevant link: https://stackoverflow.com/questions/2638292/after-travelling-back-in-firefox-history-javascript-wont-run
// eslint-disable-next-line @typescript-eslint/no-empty-function
window.onunload = function () { };
const mainMenuHandler = new MainMenuHandler(true);
