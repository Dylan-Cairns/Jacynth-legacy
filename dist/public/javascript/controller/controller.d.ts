import { Model, GameType, Layout } from '../model/model.js';
import { DeckType } from '../model/decktet.js';
import { View } from '../view/view.js';
export declare class Controller {
    model: Model;
    view: View;
    constructor(gameType: GameType, layout: Layout, deckType: DeckType);
}
