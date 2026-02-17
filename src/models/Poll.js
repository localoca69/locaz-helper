module.exports = (sequelize, DataTypes) => {
    const Poll = sequelize.define('Poll', {
        pollId: {
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
            allowNull: true
        },
        creatorId: {
            type: DataTypes.STRING,
            allowNull: false
        },
        question: {
            type: DataTypes.STRING,
            allowNull: false
        },
        options: {
            type: DataTypes.JSON,
            allowNull: false
        },
        multipleChoice: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
            allowNull: false
        },
        anonymous: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
            allowNull: false
        },
        endsAt: {
            type: DataTypes.DATE,
            allowNull: true
        },
        isActive: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
            allowNull: false
        },
        totalVotes: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
            allowNull: false
        },
        results: {
            type: DataTypes.JSON,
            defaultValue: {},
            allowNull: false
        }
    });

    Poll.associate = function(models) {
        Poll.belongsTo(models.Guild, { foreignKey: 'guildId', as: 'guild' });
        Poll.hasMany(models.PollVote, { foreignKey: 'pollId', as: 'votes' });
    };

    return Poll;
};
