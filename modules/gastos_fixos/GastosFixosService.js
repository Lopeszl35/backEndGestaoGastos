import NaoEncontrado from "../../errors/naoEncontrado.js";
import { GastoFixoEntity } from "./domain/GastoFixoEntity.js";

export default class GastosFixosService {
  constructor(GastosFixosRepository) {
    this.GastosFixosRepository = GastosFixosRepository;
  }

  async getResumoGastosFixos(id_usuario) {
    try {
      return await this.GastosFixosRepository.obterResumoGastosFixos(id_usuario);
    } catch (error) {
      console.error("Erro no GastosFixosService.getResumoGastosFixos:", error.message);
      throw error;
    }
  }

  async addGastoFixo(gastoFixoDTO, id_usuario) {
    try {
      // Instancia Entity (Valida e Normaliza)
      const entity = new GastoFixoEntity({ ...gastoFixoDTO, id_usuario });

      // Passa objeto persistence para o repository
      return await this.GastosFixosRepository.inserirGastoFixo(entity.toPersistence(), id_usuario);
    } catch (error) {
      console.error("Erro no GastosFixosService.addGastoFixo:", error.message);
      throw error;
    }
  }

  async getGastosFixos(id_usuario, somente_ativos) {
    try {
      const somenteAtivos = String(somente_ativos ?? "0") === "1";

      return await this.GastosFixosRepository.listarGastosFixos(id_usuario, {
        somenteAtivos,
      });
    } catch (error) {
      console.error("Erro no GastosFixosService.getGastosFixos:", error.message);
      throw error;
    }
  }

  async toggleAtivoGastoFixo(id_gasto_fixo, id_usuario, ativo) {
    try {
      const gasto = await this.GastosFixosRepository.buscarGastoFixoPorIdEUsuario(
        id_gasto_fixo,
        id_usuario
      );

      if (!gasto) {
        throw new NaoEncontrado("Gasto fixo não encontrado para este usuário.");
      }

      // Validação simples do input ativo
      const novoStatus = (Number(ativo) === 1 || ativo === true) ? 1 : 0;

      await this.GastosFixosRepository.atualizarAtivoGastoFixo(
        id_gasto_fixo,
        id_usuario,
        novoStatus
      );

      return { mensagem: "Status atualizado com sucesso." };
    } catch (error) {
      console.error("Erro no GastosFixosService.toggleAtivoGastoFixo:", error.message);
      throw error;
    }
  }

  async getTelaGastosFixos(id_usuario) {
    try {
      // Executa em paralelo para desempenho
      const [resumo, gastosPorCategoria, lista] = await Promise.all([
        this.GastosFixosRepository.obterResumoGastosFixos(id_usuario),
        this.GastosFixosRepository.obterGastosFixosPorCategoria(id_usuario),
        this.GastosFixosRepository.listarGastosFixos(id_usuario, { somenteAtivos: false }),
      ]);

      return {
        resumo,
        gastosPorCategoria,
        lista,
      };
    } catch (error) {
      console.error("Erro no GastosFixosService.getTelaGastosFixos:", error.message);
      throw error;
    }
  }
}