import { MainMenuHandler } from './view/utils.js';
// disable bfcache to force the page to reload every time,
// even when visited from back button. This is to
// Ensure that the single player resume button displays
// at the correct times.
// relevant link: https://stackoverflow.com/questions/2638292/after-travelling-back-in-firefox-history-javascript-wont-run
// eslint-disable-next-line @typescript-eslint/no-empty-function
window.onunload = function () { };
const mainMenuHandler = new MainMenuHandler(true, true);
// const newGameButton = document.getElementById(
//   'newGameBttn'
// ) as HTMLAnchorElement;
// const menu = document.getElementById('menu-popup') as HTMLElement;
// const rulesButton = document.getElementById('rulesButton') as HTMLButtonElement;
// const closeRulesButton = document.getElementById(
//   'closeRulesButton'
// ) as HTMLButtonElement;
// const rules = document.getElementById('rules') as HTMLElement;
// menu.classList.add('active');
// rulesButton.addEventListener('click', () => {
//   rules.classList.add('active');
// });
// closeRulesButton.addEventListener('click', () => {
//   rules.classList.remove('active');
// });
// rules.addEventListener('click', (event) => {
//   if (event.target === rules) {
//     rules.classList.remove('active');
//   }
// });
// newGameButton.addEventListener('click', (event) => {
//   event.preventDefault();
//   // removing the layout item from localStorage will cause the game app to
//   // reset the rest of the storage as well.
//   // (We don't reset it directly here to avoid duplication,
//   // and we don't have the playerIDs in order to delete card hands.)
//   localStorage.removeItem('layout');
//   location.href = newGameButton.href;
// });
// // remove 'resume game' button if there is no stored game info
// if (!localStorage.getItem('layout')) {
//   document.getElementById('singlePlayerResumeBttn')?.remove();
// }
