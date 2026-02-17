module.exports = (sequelize, DataTypes) => {
    const CouponUsage = sequelize.define('CouponUsage', {
        usageId: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        couponId: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        userId: {
            type: DataTypes.STRING,
            allowNull: false
        },
        guildId: {
            type: DataTypes.STRING,
            allowNull: false
        },
        usedAt: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
            allowNull: false
        },
        rewardValue: {
            type: DataTypes.INTEGER,
            allowNull: true
        },
        metadata: {
            type: DataTypes.JSON,
            defaultValue: {},
            allowNull: false
        }
    });

    CouponUsage.associate = function(models) {
        CouponUsage.belongsTo(models.Coupon, { foreignKey: 'couponId', as: 'coupon' });
        CouponUsage.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
        CouponUsage.belongsTo(models.Guild, { foreignKey: 'guildId', as: 'guild' });
    };

    return CouponUsage;
};
