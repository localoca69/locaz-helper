module.exports = (sequelize, DataTypes) => {
    const Guild = sequelize.define('Guild', {
        guildId: {
            type: DataTypes.STRING,
            primaryKey: true,
            allowNull: false
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false
        },
        icon: {
            type: DataTypes.STRING,
            allowNull: true
        },
        ownerId: {
            type: DataTypes.STRING,
            allowNull: false
        },
        prefix: {
            type: DataTypes.STRING,
            defaultValue: '!',
            allowNull: false
        },
        welcomeChannelId: {
            type: DataTypes.STRING,
            allowNull: true
        },
        welcomeMessage: {
            type: DataTypes.TEXT,
            defaultValue: 'Welcome {user} to {server}!',
            allowNull: false
        },
        welcomeEnabled: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
            allowNull: false
        },
        ticketCategoryId: {
            type: DataTypes.STRING,
            allowNull: true
        },
        ticketLogChannelId: {
            type: DataTypes.STRING,
            allowNull: true
        },
        supportRoleId: {
            type: DataTypes.STRING,
            allowNull: true
        },
        autoRoles: {
            type: DataTypes.JSON,
            defaultValue: [],
            allowNull: false
        },
        modLogChannelId: {
            type: DataTypes.STRING,
            allowNull: true
        },
        giveawayChannelId: {
            type: DataTypes.STRING,
            allowNull: true
        },
        boostRewardChannelId: {
            type: DataTypes.STRING,
            allowNull: true
        },
        boostRewardAmount: {
            type: DataTypes.INTEGER,
            defaultValue: 500,
            allowNull: false
        },
        stickyMessages: {
            type: DataTypes.JSON,
            defaultValue: [],
            allowNull: false
        },
        eventChannelId: {
            type: DataTypes.STRING,
            allowNull: true
        },
        newsChannelId: {
            type: DataTypes.STRING,
            allowNull: true
        },
        suggestionChannelId: {
            type: DataTypes.STRING,
            allowNull: true
        },
        mysteryBoxPrice: {
            type: DataTypes.INTEGER,
            defaultValue: 100,
            allowNull: false
        },
        mysteryBoxMaxReward: {
            type: DataTypes.INTEGER,
            defaultValue: 1000,
            allowNull: false
        },
        dailyCreditAmount: {
            type: DataTypes.INTEGER,
            defaultValue: 50,
            allowNull: false
        },
        startingCredits: {
            type: DataTypes.INTEGER,
            defaultValue: 100,
            allowNull: false
        },
        isPremium: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
            allowNull: false
        },
        premiumExpires: {
            type: DataTypes.DATE,
            allowNull: true
        },
        settings: {
            type: DataTypes.JSON,
            defaultValue: {},
            allowNull: false
        }
    });

    Guild.associate = function(models) {
        Guild.hasMany(models.Ticket, { foreignKey: 'guildId', as: 'tickets' });
        Guild.hasMany(models.Giveaway, { foreignKey: 'guildId', as: 'giveaways' });
        Guild.hasMany(models.ModerationLog, { foreignKey: 'guildId', as: 'moderationLogs' });
        Guild.hasMany(models.Suggestion, { foreignKey: 'guildId', as: 'suggestions' });
        Guild.hasMany(models.Poll, { foreignKey: 'guildId', as: 'polls' });
        Guild.hasMany(models.Coupon, { foreignKey: 'guildId', as: 'coupons' });
    };

    return Guild;
};
