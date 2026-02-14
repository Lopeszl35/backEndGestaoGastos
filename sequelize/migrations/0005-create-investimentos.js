// sequelize/migrations/XXXX-create-investimentos.js
await queryInterface.createTable("investimentos", {
  id_investimento: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  id_usuario: { type: DataTypes.INTEGER, allowNull: false },
  tipo: { type: DataTypes.ENUM('ACAO', 'FII', 'CDB', 'TESOURO', 'CRIPTO'), allowNull: false },
  ticker: { type: DataTypes.STRING(20), allowNull: true }, // Ex: PETR4, BTC, SELIC-2029
  nome: { type: DataTypes.STRING(100), allowNull: false }, // Ex: Petrobras PN
  quantidade: { type: DataTypes.DECIMAL(18, 8), allowNull: false }, // Decimal longo para fração de cripto
  preco_medio: { type: DataTypes.DECIMAL(18, 2), allowNull: false }, // Quanto o usuário pagou
  valor_total_investido: { type: DataTypes.DECIMAL(18, 2), allowNull: false },
  data_compra: { type: DataTypes.DATEONLY, allowNull: false },
  instituicao: { type: DataTypes.STRING(50), allowNull: true },
});