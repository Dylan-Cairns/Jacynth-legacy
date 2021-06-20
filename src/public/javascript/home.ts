const menu = document.getElementById('menu-popup') as HTMLElement;
const rulesButton = document.getElementById('rulesButton') as HTMLButtonElement;
const closeRulesButton = document.getElementById(
  'closeRulesButton'
) as HTMLButtonElement;
const rules = document.getElementById('rules') as HTMLElement;

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
