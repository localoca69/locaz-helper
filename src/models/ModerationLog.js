module.exports = (sequelize, DataTypes) => {
    const ModerationLog = sequelize.define('ModerationLog', {
        logId: {
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
        moderatorId: {
            type: DataTypes.STRING,
            allowNull: false
        },
        action: {
            type: DataTypes.ENUM('ban', 'unban', 'kick', 'mute', 'unmute', 'warn', 'timeout', 'untimeout'),
            allowNull: false
        },
        reason: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        duration: {
            type: DataTypes.INTEGER,
            allowNull: true
        },
        expiresAt: {
            type: DataTypes.DATE,
            allowNull: true
        },
        isActive: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
            allowNull: false
        },
        evidence: {
            type: DataTypes.JSON,
            defaultValue: [],
            allowNull: false
        },
        metadata: {
            type: DataTypes.JSON,
            defaultValue: {},
            allowNull: false
        },
        caseNumber: {
            type: DataTypes.INTEGER,
            allowNull: false
        }
    });

    ModerationLog.associate = function(models) {
        ModerationLog.belongsTo(models.Guild, { foreignKey: 'guildId', as: 'guild' });
        ModerationLog.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
    };

    return ModerationLog;
};
