var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
// game objects used by server side multiplayer code
import { Decktet } from '../public/javascript/model/decktet.js';
import { storeMPGameResult } from '../db_model/queries.js';
export class SocketServer {
    constructor(io) {
        const roomsGameData = [];
        io.on('connection', (socket) => {
            console.log('a user connected');
            let currRoomNo = 0;
            let foundRoom = false;
            let room = io.sockets.adapter.rooms.get(`room-${currRoomNo}`);
            while (!foundRoom) {
                room = io.sockets.adapter.rooms.get(`room-${currRoomNo}`);
                // go to next room if current room is full.
                if (room && room.size === 2) {
                    currRoomNo++;
                    // if room already has 1 player: check if the game already started.
                    // if so, go to next room. otherwise join as player 2.
                }
                else if (room &&
                    room.size === 1 &&
                    roomsGameData[currRoomNo] &&
                    roomsGameData[currRoomNo].p2ready == true) {
                    currRoomNo++;
                }
                else {
                    // otherwise, the room is empty, or only has 1 player & has not been started.
                    // we can join the room.
                    foundRoom = true;
                }
            }
            console.log(`join room-${currRoomNo}`);
            socket.join(`room-${currRoomNo}`);
            room = io.sockets.adapter.rooms.get(`room-${currRoomNo}`);
            let playerID;
            const deck = new Decktet('basicDeck');
            socket.on('getPlayerID', (userID) => {
                if (!roomsGameData[currRoomNo] || (room && room.size === 1)) {
                    playerID = 'Player 1';
                    // if the game data obj doesn't exist create it. Or overwrite the existing
                    // object if we are the first player in the game room.
                    roomsGameData[currRoomNo] = {
                        roomName: `room-${currRoomNo}`,
                        layoutSpaces: undefined,
                        layoutCards: [],
                        layout: undefined,
                        p1Connected: true,
                        p1ID: userID,
                        p1ready: false,
                        p2Connected: false,
                        p2ID: 'guest',
                        p2ready: false,
                        cardDeck: deck
                    };
                }
                else {
                    playerID = 'Player 2';
                    roomsGameData[currRoomNo].p2Connected = true;
                    roomsGameData[currRoomNo].p2ID = userID;
                }
                socket.emit('recievePlayerID', playerID);
            });
            // draw cards for the starting layout. they will be sent later once the
            // playerReady command is recieved from both players
            socket.on('createStartingLayout', (layout, layoutArr) => {
                console.log('getStartingLayout called');
                // if this is the first player initiated call to this method,
                // draw the cards for the layout. Otherwise ignore it.
                roomsGameData[currRoomNo].layout = layout;
                if (!roomsGameData[currRoomNo].layoutSpaces) {
                    console.log('drawing cards & generating layout');
                    roomsGameData[currRoomNo].layoutSpaces = layoutArr;
                    layoutArr.forEach((spaceID) => {
                        var _a, _b;
                        const card = (_a = roomsGameData[currRoomNo].cardDeck) === null || _a === void 0 ? void 0 : _a.drawCard();
                        if (!card)
                            return;
                        (_b = roomsGameData[currRoomNo].layoutCards) === null || _b === void 0 ? void 0 : _b.push(card);
                    });
                }
            });
            const drawCardCB = (playerID) => {
                var _a;
                console.log('drawCard called');
                const card = (_a = roomsGameData[currRoomNo].cardDeck) === null || _a === void 0 ? void 0 : _a.drawCard();
                if (!card)
                    return;
                io.to(`room-${currRoomNo}`).emit('recieveCardDraw', card.getId(), playerID);
            };
            // respond to player request to draw a card
            socket.on('drawCard', drawCardCB);
            socket.on('playerReady', (currPlyrID) => {
                var _a;
                // Send players the current room number to display in the UI
                io.to(`room-${currRoomNo}`).emit('connectToRoom', currRoomNo);
                if (currPlyrID === 'Player 1') {
                    roomsGameData[currRoomNo].p1ready = true;
                }
                else {
                    roomsGameData[currRoomNo].p2ready = true;
                }
                // if both players are ready, start the game!
                if (roomsGameData[currRoomNo].p1ready &&
                    roomsGameData[currRoomNo].p2ready) {
                    // send initial layout
                    (_a = roomsGameData[currRoomNo].layoutSpaces) === null || _a === void 0 ? void 0 : _a.forEach((spaceID, idx) => {
                        if (roomsGameData[currRoomNo].layoutCards.length === 0)
                            return;
                        const card = roomsGameData[currRoomNo].layoutCards[idx];
                        if (!card)
                            return;
                        io.to(`room-${currRoomNo}`).emit('recieveLayoutCard', card.getId(), spaceID);
                    });
                    // draw 3 cards for each player
                    [0, 0, 0].forEach((ele) => drawCardCB('Player 1'));
                    [0, 0, 0].forEach((ele) => drawCardCB('Player 2'));
                    io.to(`room-${currRoomNo}`).emit('enableP1CardDragging');
                    io.to(`room-${currRoomNo}`).emit('p2Ready');
                }
            });
            socket.on('sendPlayerMove', (playerID, cardID, SpaceID, TokenSpaceID) => {
                console.log('socket emit sendPlayerMove method recieved by server');
                console.log(playerID, cardID, SpaceID, TokenSpaceID);
                socket
                    .to(`room-${currRoomNo}`)
                    .emit('recievePlayerMove', playerID, cardID, SpaceID, TokenSpaceID);
                // next player start turn
                const nextPlayer = playerID === 'Player 1' ? 'Player 2' : 'Player 1';
                socket.to(`room-${currRoomNo}`).emit('beginNextTurn', nextPlayer);
            });
            socket.on('addRecordtoDB', (player1Score, player2Score) => {
                const user1ID = roomsGameData[currRoomNo].p1ID;
                const user2ID = roomsGameData[currRoomNo].p2ID;
                const layout = roomsGameData[currRoomNo].layout;
                console.log('server recieved add game record to DB request');
                (() => __awaiter(this, void 0, void 0, function* () {
                    try {
                        const result = yield storeMPGameResult(user1ID, player1Score, user2ID, player2Score, layout);
                        console.log(result);
                    }
                    catch (error) {
                        console.log(error);
                    }
                }))();
            });
            socket.on('disconnect', () => {
                console.log(`${playerID} disconnected`);
                io.in(`room-${currRoomNo}`).disconnectSockets(true);
            });
        });
    }
}
