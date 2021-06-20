"use strict";
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
