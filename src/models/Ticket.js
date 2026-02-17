module.exports = (sequelize, DataTypes) => {
    const Ticket = sequelize.define('Ticket', {
        ticketId: {
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
        channelId: {
            type: DataTypes.STRING,
            allowNull: false
        },
        messageId: {
            type: DataTypes.STRING,
            allowNull: false
        },
        category: {
            type: DataTypes.STRING,
            allowNull: false
        },
        subject: {
            type: DataTypes.STRING,
            allowNull: false
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        status: {
            type: DataTypes.ENUM('open', 'closed', 'claimed'),
            defaultValue: 'open',
            allowNull: false
        },
        priority: {
            type: DataTypes.ENUM('low', 'medium', 'high', 'urgent'),
            defaultValue: 'medium',
            allowNull: false
        },
        claimedBy: {
            type: DataTypes.STRING,
            allowNull: true
        },
        claimedAt: {
            type: DataTypes.DATE,
            allowNull: true
        },
        closedBy: {
            type: DataTypes.STRING,
            allowNull: true
        },
        closedAt: {
            type: DataTypes.DATE,
            allowNull: true
        },
        closeReason: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        rating: {
            type: DataTypes.INTEGER,
            allowNull: true
        },
        feedback: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        tags: {
            type: DataTypes.JSON,
            defaultValue: [],
            allowNull: false
        },
        transcript: {
            type: DataTypes.TEXT,
            allowNull: true
        }
    });

    Ticket.associate = function(models) {
        Ticket.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
        Ticket.belongsTo(models.Guild, { foreignKey: 'guildId', as: 'guild' });
        Ticket.hasMany(models.TicketMessage, { foreignKey: 'ticketId', as: 'messages' });
    };

    return Ticket;
};
