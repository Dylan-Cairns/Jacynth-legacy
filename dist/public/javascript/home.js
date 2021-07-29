"use strict";
var _a;
const newGameButton = document.getElementById('newGameBttn');
const menu = document.getElementById('menu-popup');
const rulesButton = document.getElementById('rulesButton');
const closeRulesButton = document.getElementById('closeRulesButton');
const rules = document.getElementById('rules');
menu.classList.add('active');
rulesButton.addEventListener('click', () => {
    rules.classList.add('active');
});
closeRulesButton.addEventListener('click', () => {
    rules.classList.remove('active');
});
rules.addEventListener('click', (event) => {
    if (event.target === rules) {
        rules.classList.remove('active');
    }
});
newGameButton.addEventListener('click', (event) => {
    event.preventDefault();
    // removing the layout item from localStorage will cause the game app to
    // reset the rest of the storage as well.
    // (We don't reset it directly here to avoid duplication,
    // and we don't have the playerIDs in order to delete card hands.)
    localStorage.removeItem('layout');
    location.href = newGameButton.href;
});
// remove 'resume game' button if there is no stored game info
if (!localStorage.getItem('layout')) {
    (_a = document.getElementById('singlePlayerResumeBttn')) === null || _a === void 0 ? void 0 : _a.remove();
}
