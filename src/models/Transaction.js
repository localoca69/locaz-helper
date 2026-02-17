module.exports = (sequelize, DataTypes) => {
    const Transaction = sequelize.define('Transaction', {
        transactionId: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        userId: {
            type: DataTypes.STRING,
            allowNull: false
        },
        guildId: {
            type: DataTypes.STRING,
            allowNull: false
        },
        type: {
            type: DataTypes.ENUM('credit', 'debit', 'transfer', 'reward', 'penalty', 'refund', 'purchase'),
            allowNull: false
        },
        amount: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        balance: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        description: {
            type: DataTypes.STRING,
            allowNull: false
        },
        category: {
            type: DataTypes.STRING,
            allowNull: true
        },
        referenceId: {
            type: DataTypes.STRING,
            allowNull: true
        },
        referenceType: {
            type: DataTypes.STRING,
            allowNull: true
        },
        processedBy: {
            type: DataTypes.STRING,
            allowNull: true
        },
        metadata: {
            type: DataTypes.JSON,
            defaultValue: {},
            allowNull: false
        }
    });

    Transaction.associate = function(models) {
        Transaction.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
        Transaction.belongsTo(models.Guild, { foreignKey: 'guildId', as: 'guild' });
    };

    return Transaction;
};
