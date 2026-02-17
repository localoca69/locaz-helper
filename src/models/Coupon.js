module.exports = (sequelize, DataTypes) => {
    const Coupon = sequelize.define('Coupon', {
        couponId: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        guildId: {
            type: DataTypes.STRING,
            allowNull: false
        },
        code: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true
        },
        type: {
            type: DataTypes.ENUM('percentage', 'fixed', 'credits'),
            allowNull: false
        },
        value: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        description: {
            type: DataTypes.STRING,
            allowNull: true
        },
        maxUses: {
            type: DataTypes.INTEGER,
            allowNull: true
        },
        usedCount: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
            allowNull: false
        },
        isActive: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
            allowNull: false
        },
        expiresAt: {
            type: DataTypes.DATE,
            allowNull: true
        },
        createdBy: {
            type: DataTypes.STRING,
            allowNull: false
        },
        requirements: {
            type: DataTypes.JSON,
            defaultValue: {},
            allowNull: false
        },
        isGlobal: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
            allowNull: false
        }
    });

    Coupon.associate = function(models) {
        Coupon.belongsTo(models.Guild, { foreignKey: 'guildId', as: 'guild' });
        Coupon.hasMany(models.CouponUsage, { foreignKey: 'couponId', as: 'usages' });
    };

    return Coupon;
};
