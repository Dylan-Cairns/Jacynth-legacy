// class to handle the main menu on all pages
export class MainMenuHandler {
  menuButton: HTMLButtonElement | undefined;
  closeMenuButton: HTMLButtonElement | undefined;
  menu: HTMLElement;
  rulesButton: HTMLButtonElement;
  closeRulesButton: HTMLButtonElement;
  rules: HTMLElement;
  overlay: HTMLElement | undefined;
  newGameButton: HTMLAnchorElement;
  constructor(startVisible: boolean, showResume: boolean) {
    this.menuButton = document.getElementById('menuButton') as
      | HTMLButtonElement
      | undefined;
    this.closeMenuButton = document.getElementById('closeMenuButton') as
      | HTMLButtonElement
      | undefined;
    this.menu = document.getElementById('menu-popup') as HTMLElement;
    this.rulesButton = document.getElementById(
      'rulesButton'
    ) as HTMLButtonElement;
    this.closeRulesButton = document.getElementById(
      'closeRulesButton'
    ) as HTMLButtonElement;
    this.rules = document.getElementById('rules') as HTMLElement;
    this.overlay = document.getElementById('overlay') as
      | HTMLElement
      | undefined;
    this.newGameButton = document.getElementById(
      'newGameBttn'
    ) as HTMLAnchorElement;

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
      document.getElementById('singlePlayerResumeBttn')?.remove();
    }
  }

  public openModal(modal: Element | HTMLElement | undefined) {
    if (modal == null) return;
    modal.classList.add('active');
    if (this.overlay) this.overlay.classList.add('active');
  }

  public closeModal(modal: Element | HTMLElement | undefined) {
    if (modal == null) return;
    modal.classList.remove('active');
    if (this.overlay) this.overlay.classList.remove('active');
  }
}
