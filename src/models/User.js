module.exports = (sequelize, DataTypes) => {
    const User = sequelize.define('User', {
        userId: {
            type: DataTypes.STRING,
            primaryKey: true,
            allowNull: false
        },
        username: {
            type: DataTypes.STRING,
            allowNull: false
        },
        discriminator: {
            type: DataTypes.STRING,
            allowNull: false
        },
        avatar: {
            type: DataTypes.STRING,
            allowNull: true
        },
        credits: {
            type: DataTypes.INTEGER,
            defaultValue: 100,
            allowNull: false
        },
        totalSpent: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
            allowNull: false
        },
        totalEarned: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
            allowNull: false
        },
        level: {
            type: DataTypes.INTEGER,
            defaultValue: 1,
            allowNull: false
        },
        experience: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
            allowNull: false
        },
        isBanned: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
            allowNull: false
        },
        banReason: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        banExpires: {
            type: DataTypes.DATE,
            allowNull: true
        },
        warnings: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
            allowNull: false
        },
        lastDaily: {
            type: DataTypes.DATE,
            allowNull: true
        },
        mysteryBoxes: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
            allowNull: false
        },
        boostCount: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
            allowNull: false
        },
        isAdmin: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
            allowNull: false
        },
        isModerator: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
            allowNull: false
        },
        joinedAt: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
            allowNull: false
        }
    });

    User.associate = function(models) {
        User.hasMany(models.Transaction, { foreignKey: 'userId', as: 'transactions' });
        User.hasMany(models.Ticket, { foreignKey: 'userId', as: 'tickets' });
        User.hasMany(models.GiveawayEntry, { foreignKey: 'userId', as: 'giveawayEntries' });
        User.hasMany(models.Suggestion, { foreignKey: 'userId', as: 'suggestions' });
        User.hasMany(models.Invoice, { foreignKey: 'userId', as: 'invoices' });
    };

    return User;
};
