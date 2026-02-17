module.exports = (sequelize, DataTypes) => {
    const GiveawayEntry = sequelize.define('GiveawayEntry', {
        entryId: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        giveawayId: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        userId: {
            type: DataTypes.STRING,
            allowNull: false
        },
        guildId: {
            type: DataTypes.STRING,
            allowNull: false
        },
        enteredAt: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
            allowNull: false
        },
        isWinner: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
            allowNull: false
        },
        claimed: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
            allowNull: false
        },
        claimedAt: {
            type: DataTypes.DATE,
            allowNull: true
        }
    });

    GiveawayEntry.associate = function(models) {
        GiveawayEntry.belongsTo(models.Giveaway, { foreignKey: 'giveawayId', as: 'giveaway' });
        GiveawayEntry.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
        GiveawayEntry.belongsTo(models.Guild, { foreignKey: 'guildId', as: 'guild' });
    };

    return GiveawayEntry;
};
