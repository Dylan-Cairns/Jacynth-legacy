import { Model } from '../model/model';
import { Card, Decktet } from '../model/decktet';
import { View } from '../view/view';

class Controller {
  game: Model;
  view: View;

  constructor(model: Model, view: View) {
    this.game = model;
    this.view = view;
  }
}

const model = new Model('vsAi');
const view = new View();

const controller = new Controller(model, view);
