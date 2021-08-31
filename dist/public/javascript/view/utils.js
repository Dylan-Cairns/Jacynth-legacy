// class to handle the main menu on all pages
export class MainMenuHandler {
    constructor(startVisible, showResume) {
        var _a;
        this.menuButton = document.getElementById('menuButton');
        this.closeMenuButton = document.getElementById('closeMenuButton');
        this.menu = document.getElementById('menu-popup');
        this.rulesButton = document.getElementById('rulesButton');
        this.closeRulesButton = document.getElementById('closeRulesButton');
        this.rules = document.getElementById('rules');
        this.overlay = document.getElementById('overlay');
        this.newGameButton = document.getElementById('newGameBttn');
        // menu modals and buttons
        if (this.menuButton) {
            this.menuButton.addEventListener('click', () => {
                this.openModal(this.menu);
            });
        }
        if (this.closeMenuButton) {
            this.closeMenuButton.addEventListener('click', () => {
                this.closeModal(this.menu);
            });
        }
        if (this.overlay) {
            this.overlay.addEventListener('click', () => {
                const modals = document.querySelectorAll('.modal.active');
                modals.forEach((modal) => {
                    this.closeModal(modal);
                });
            });
        }
        this.rulesButton.addEventListener('click', () => {
            this.openModal(this.rules);
        });
        this.closeRulesButton.addEventListener('click', () => {
            this.rules.classList.remove('active');
        });
        this.rules.addEventListener('click', (event) => {
            if (event.target === this.rules) {
                this.rules.classList.remove('active');
            }
        });
        this.newGameButton.addEventListener('click', (event) => {
            event.preventDefault();
            localStorage.removeItem('layout');
            location.href = this.newGameButton.href;
        });
        if (startVisible) {
            this.menu.classList.add('active');
        }
        // remove 'resume game' button if there is no stored game info,
        // or if the showResume switch was set to false upon class initialization
        if (!localStorage.getItem('layout') || !showResume) {
            (_a = document.getElementById('singlePlayerResumeBttn')) === null || _a === void 0 ? void 0 : _a.remove();
        }
    }
    openModal(modal) {
        if (modal == null)
            return;
        modal.classList.add('active');
        if (this.overlay)
            this.overlay.classList.add('active');
    }
    closeModal(modal) {
        if (modal == null)
            return;
        modal.classList.remove('active');
        if (this.overlay)
            this.overlay.classList.remove('active');
    }
}
