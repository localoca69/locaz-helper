module.exports = (sequelize, DataTypes) => {
    const Giveaway = sequelize.define('Giveaway', {
        giveawayId: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        guildId: {
            type: DataTypes.STRING,
            allowNull: false
        },
        channelId: {
            type: DataTypes.STRING,
            allowNull: false
        },
        messageId: {
            type: DataTypes.STRING,
            allowNull: false
        },
        hostId: {
            type: DataTypes.STRING,
            allowNull: false
        },
        prize: {
            type: DataTypes.STRING,
            allowNull: false
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        winners: {
            type: DataTypes.INTEGER,
            defaultValue: 1,
            allowNull: false
        },
        duration: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        endsAt: {
            type: DataTypes.DATE,
            allowNull: false
        },
        status: {
            type: DataTypes.ENUM('active', 'ended', 'cancelled'),
            defaultValue: 'active',
            allowNull: false
        },
        requirements: {
            type: DataTypes.JSON,
            defaultValue: {},
            allowNull: false
        },
        entries: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
            allowNull: false
        },
        endedAt: {
            type: DataTypes.DATE,
            allowNull: true
        },
        winnerIds: {
            type: DataTypes.JSON,
            defaultValue: [],
            allowNull: false
        },
        isPremium: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
            allowNull: false
        }
    });

    Giveaway.associate = function(models) {
        Giveaway.belongsTo(models.Guild, { foreignKey: 'guildId', as: 'guild' });
        Giveaway.hasMany(models.GiveawayEntry, { foreignKey: 'giveawayId', as: 'entries' });
    };

    return Giveaway;
};
