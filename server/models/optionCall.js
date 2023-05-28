module.exports = function(sequelize, DataTypes) {
  const OptionCall = sequelize.define(
    "OptionCall",
    {
      callId: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        allowNull: false,
      },
      exp_date: {
        type: DataTypes.DATEONLY,
        allowNull: true,
      },
      ts: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      ticker: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      contractSymbol: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      lastTradeDate: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      strike: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      lastPrice: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      bid: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      ask: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      _change: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      percentChange: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      volume: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      openInterest: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      impliedVolatility: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      inTheMoney: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      contractSize: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      currency: {
        type: DataTypes.STRING,
        allowNull: true,
      },
    },
    {
      timestamps: false,
    }
  );

  return OptionCall;
};
