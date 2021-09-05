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

export class TabsHandler {
  constructor() {
    const tabs = document.querySelectorAll(
      '[data-tab-target]'
    ) as NodeListOf<HTMLElement>;
    const tabContents = document.querySelectorAll('[data-tab-content]');

    tabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        const target = document.querySelector(tab.dataset.tabTarget!)!;
        tabContents.forEach((tabContent) => {
          tabContent.classList.remove('active');
        });
        tabs.forEach((tab) => {
          tab.classList.remove('active');
        });
        tab.classList.add('active');
        target.classList.add('active');
      });
    });
  }
}

// method to create tables from scores data on profile and high scores pages
export function populateTable(
  items: [Record<string, string>],
  tableName: string
) {
  const table = document.getElementById(tableName) as HTMLTableElement;
  const tBody = table.getElementsByTagName('tbody')[0];

  if (!table.tHead) {
    const header = table.createTHead();
    const tr = header.insertRow(0);
    Object.keys(items[0]).forEach((key) => {
      const th = document.createElement('th');
      th.innerHTML = key;
      tr.appendChild(th);
    });
  }

  items.forEach((item: Record<string, string>) => {
    const row = tBody.insertRow();
    Object.keys(item).forEach((key) => {
      const newRow = row.insertCell();
      // reformat ugly dates
      if (key === 'Date') {
        const date = new Date(item[key]);
        const string = convertDate(date);
        newRow.innerHTML = string;
      } else {
        newRow.innerHTML = item[key];
      }
      newRow.setAttribute('data-label', key);
    });
  });
}

function convertDate(dateObj: Date) {
  const month = dateObj.getUTCMonth() + 1; //months from 1-12
  const day = dateObj.getUTCDate();
  const year = dateObj.getUTCFullYear();
  const newDate = year + '/' + month + '/' + day;
  return newDate;
}
