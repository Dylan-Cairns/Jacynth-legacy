var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { MainMenuHandler, TabsHandler, populateTable } from './view/utils.js';
const mainMenuHandler = new MainMenuHandler(false, true);
const tabsHandler = new TabsHandler();
(() => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const response = yield fetch('/getSPHighScores');
        const SPgameData = yield response.json();
        if (SPgameData) {
            // create sp game data table
            populateTable(SPgameData, 'SPGameRecords');
            document.getElementById('spinner').style.visibility = 'hidden';
            document.getElementById('loadScreen').classList.remove('active');
        }
    }
    catch (error) {
        console.log(error);
    }
}))();
(() => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const response = yield fetch('/getMPHighScores');
        const MPgameData = yield response.json();
        if (MPgameData) {
            // create sp game data table
            populateTable(MPgameData, 'MPGameRecords');
            document.getElementById('spinner').style.visibility = 'hidden';
            document.getElementById('loadScreen').classList.remove('active');
        }
    }
    catch (error) {
        console.log(error);
    }
}))();
