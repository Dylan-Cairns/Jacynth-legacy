import { Model } from '../model/model';
import { View } from '../view/view';
export class Controller {
    constructor(gameType, layout) {
        this.model = new Model('vsAI', 'razeway', this.handlePlayCard, this.handleDrawCard);
        this.view = new View(this.model.board);
    }
    handlePlayCard(playerID, card, boardSpace) {
        if (playerID === 'computerPlayer') {
            this.view.computerPlayCard(card, boardSpace);
        }
    }
    handleDrawCard(card) {
        this.view.playerDrawCard(card);
    }
}
