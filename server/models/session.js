module.exports = (sequelize, DataTypes) => {
  const Session = sequelize.define("Session", {
    refreshTokenId: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
    },
    userId: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    refreshToken: {
      type: DataTypes.STRING,
      defaultValue: "",
    },
  });
  return Session;
};
