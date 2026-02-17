module.exports = (sequelize, DataTypes) => {
    const MysteryBox = sequelize.define('MysteryBox', {
        boxId: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        guildId: {
            type: DataTypes.STRING,
            allowNull: false
        },
        userId: {
            type: DataTypes.STRING,
            allowNull: false
        },
        boxType: {
            type: DataTypes.ENUM('common', 'rare', 'epic', 'legendary'),
            defaultValue: 'common',
            allowNull: false
        },
        price: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        rewards: {
            type: DataTypes.JSON,
            allowNull: false
        },
        isOpened: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
            allowNull: false
        },
        openedAt: {
            type: DataTypes.DATE,
            allowNull: true
        },
        claimedRewards: {
            type: DataTypes.JSON,
            defaultValue: [],
            allowNull: false
        },
        metadata: {
            type: DataTypes.JSON,
            defaultValue: {},
            allowNull: false
        }
    });

    MysteryBox.associate = function(models) {
        MysteryBox.belongsTo(models.Guild, { foreignKey: 'guildId', as: 'guild' });
        MysteryBox.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
    };

    return MysteryBox;
};
