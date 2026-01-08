// Função auxiliar para converter DD/MM/YYYY -> YYYY-MM-DD
export function formatarDataParaBanco(dataString) {
  if (!dataString) return new Date(); // Retorna hoje se vazio

  // Se já estiver no formato YYYY-MM-DD, retorna direto
  if (String(dataString).match(/^\d{4}-\d{2}-\d{2}$/)) {
    return dataString;
  }

  // Se estiver em DD/MM/YYYY
  if (String(dataString).match(/^\d{2}\/\d{2}\/\d{4}$/)) {
    const [dia, mes, ano] = dataString.split("/");
    return `${ano}-${mes}-${dia}`;
  }

  return dataString;
}
