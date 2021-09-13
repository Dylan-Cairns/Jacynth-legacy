"use strict";
// export class mainMenuHandler {
//   constructor() {
//     // menu modals and buttons
//     this.menuButton.addEventListener('click', () => {
//       this.removeControlledSpacesHighlighting();
//       this.removeSpaceHighlighting();
//       this.openModal(this.menu);
//     });
//     this.closeMenuButton.addEventListener('click', () => {
//       this.closeModal(this.menu);
//     });
//     this.overlay.addEventListener('click', () => {
//       const modals = document.querySelectorAll('.modal.active');
//       modals.forEach((modal) => {
//         this.closeModal(modal);
//       });
//     });
//     this.rulesButton.addEventListener('click', () => {
//       this.openModal(this.rules);
//     });
//     this.closeRulesButton.addEventListener('click', () => {
//       rules.classList.remove('active');
//     });
//     this.rules.addEventListener('click', (event) => {
//       if (event.target === this.rules) {
//         rules.classList.remove('active');
//       }
//     });
//     this.newGameButton.addEventListener('click', (event) => {
//       event.preventDefault();
//       if (this.resetStorage) this.resetStorage();
//       location.href = this.newGameButton.href;
//     });
//   }
//   public openModal(modal: Element | HTMLElement) {
//     if (modal == null) return;
//     modal.classList.add('active');
//     this.overlay.classList.add('active');
//   }
//   public closeModal(modal: Element | HTMLElement) {
//     if (modal == null) return;
//     modal.classList.remove('active');
//     this.overlay.classList.remove('active');
//   }
// }
