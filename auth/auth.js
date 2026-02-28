// auth/auth.js
import { comparePassword } from './passwordHash.js';
import ErroNaoAutorizado from '../errors/ErroNaoAutorizado.js';

export default class Auth {
    static async senhaValida(password, senhaHash) {
        // Recebe o resultado da abstração
        const { isValid, isLegacy } = await comparePassword(password, senhaHash);
        
        if (!isValid) {
            throw new ErroNaoAutorizado("Credenciais inválidas.");
        }

        return { isValid, isLegacy };
    }
}