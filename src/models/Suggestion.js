module.exports = (sequelize, DataTypes) => {
    const Suggestion = sequelize.define('Suggestion', {
        suggestionId: {
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
        title: {
            type: DataTypes.STRING,
            allowNull: false
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: false
        },
        messageId: {
            type: DataTypes.STRING,
            allowNull: true
        },
        status: {
            type: DataTypes.ENUM('pending', 'approved', 'denied', 'implemented'),
            defaultValue: 'pending',
            allowNull: false
        },
        upvotes: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
            allowNull: false
        },
        downvotes: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
            allowNull: false
        },
        reviewedBy: {
            type: DataTypes.STRING,
            allowNull: true
        },
        reviewedAt: {
            type: DataTypes.DATE,
            allowNull: true
        },
        reviewReason: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        tags: {
            type: DataTypes.JSON,
            defaultValue: [],
            allowNull: false
        }
    });

    Suggestion.associate = function(models) {
        Suggestion.belongsTo(models.Guild, { foreignKey: 'guildId', as: 'guild' });
        Suggestion.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
        Suggestion.hasMany(models.SuggestionVote, { foreignKey: 'suggestionId', as: 'votes' });
    };

    return Suggestion;
};
