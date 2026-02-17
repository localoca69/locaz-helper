module.exports = (sequelize, DataTypes) => {
    const Invoice = sequelize.define('Invoice', {
        invoiceId: {
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
        invoiceNumber: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true
        },
        amount: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false
        },
        currency: {
            type: DataTypes.STRING,
            defaultValue: 'USD',
            allowNull: false
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: false
        },
        status: {
            type: DataTypes.ENUM('pending', 'paid', 'cancelled', 'refunded'),
            defaultValue: 'pending',
            allowNull: false
        },
        paymentMethod: {
            type: DataTypes.STRING,
            allowNull: true
        },
        transactionId: {
            type: DataTypes.STRING,
            allowNull: true
        },
        paidAt: {
            type: DataTypes.DATE,
            allowNull: true
        },
        dueDate: {
            type: DataTypes.DATE,
            allowNull: true
        },
        items: {
            type: DataTypes.JSON,
            defaultValue: [],
            allowNull: false
        },
        notes: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        metadata: {
            type: DataTypes.JSON,
            defaultValue: {},
            allowNull: false
        }
    });

    Invoice.associate = function(models) {
        Invoice.belongsTo(models.Guild, { foreignKey: 'guildId', as: 'guild' });
        Invoice.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
    };

    return Invoice;
};
