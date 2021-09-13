// custom express-validator to check for duplicate existing username
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { findExistingNick, findNickforUser } from '../api/queries.js';
export const isValidNickname = (nickname) => {
    return findExistingNick(nickname).then((result) => {
        if (result.rowCount > 0) {
            return Promise.reject('Nickname already in use');
        }
    });
};
// method user to check if user has chosen a nickname
export const hasNickname = (userID) => __awaiter(void 0, void 0, void 0, function* () {
    let results;
    try {
        results = yield findNickforUser(userID);
    }
    catch (error) {
        console.log(error);
    }
    return results && results.rowCount > 0;
});
