import ErroBase from "./Errobase.js";

export default class ErroNaoAutorizado extends ErroBase {
    constructor(message = 'Acesso não autorizado', details = null) {
        super(message, 401, 'UNAUTHORIZED', details ? [details] : null);
    }
}