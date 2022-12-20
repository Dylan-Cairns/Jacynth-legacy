# A digital adaptation of the game Jacynth

## Note: this repository contains the code for a version of the game which is no longer hosted. A simplified single player version can be player [here](https://dylan-cairns.github.io/jacynth/) with code [here](https://github.com/Dylan-Cairns/Jacynth).

This is an implementation of the card game [Jacynth](http://wiki.decktet.com/game:jacynth) from the [Decktet](https://www.decktet.com/).

You can read about the creation of the app [here](https://dylan-cairns.github.io/Jacynth-legacy/).

Features:

- Written in Typescript
- MVC based design
- Express.js backend
- Singleplayer against rule-based AI
- Multiplayer enabled by Socket.io
- Mobile-first responsive design
- HTML 5 Drag and Drop interface (with polyfill for mobile browsers)
- Resume of single player games via the use of localStorage
- User authentication via 3rd party service (auth0)
- High scores and user game records stored in Postgresql via rest API

Desktop:

<p float="middle">
  <img src="screenshots/Screen Shot 2021-07-07 at 13.32.06.png" width="500" /> 
</p>
Mobile:
<p float="middle">
  <img src="screenshots/Screen Shot 2021-07-07 at 13.31.52.png" width="300" />
</p>
