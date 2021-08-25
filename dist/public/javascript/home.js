"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var _a;
// disable bfcache to force the page to reload every time,
// even when visited from back button. This is to
// Ensure that the single player resume button displays
// at the correct times.
// relevant link: https://stackoverflow.com/questions/2638292/after-travelling-back-in-firefox-history-javascript-wont-run
// eslint-disable-next-line @typescript-eslint/no-empty-function
window.onunload = function () { };
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
(() => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const response = yield fetch('/users');
        const books = yield response.json();
        console.log(books);
    }
    catch (error) {
        console.log(error);
    }
}))();
