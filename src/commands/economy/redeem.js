const { SlashCommandBuilder } = require('discord.js');
const { createSuccessEmbed, createErrorEmbed, createEmbed } = require('../../utils/embeds');
const { getUser, addCredits, formatCredits } = require('../../utils/helpers');
const { models } = require('../../handlers/databaseHandler');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('redeem')
        .setDescription('Redeem a coupon code')
        .addStringOption(option =>
            option.setName('code')
                .setDescription('Coupon code to redeem')
                .setRequired(true)
        ),
    async execute(interaction) {
        try {
            const code = interaction.options.getString('code').toUpperCase();
            
            const coupon = await models.Coupon.findOne({
                where: {
                    code,
                    isActive: true
                }
            });
            
            if (!coupon) {
                return interaction.reply({
                    embeds: [createErrorEmbed('Invalid or expired coupon code.')],
                    ephemeral: true
                });
            }
            
            if (coupon.expiresAt && new Date() > coupon.expiresAt) {
                return interaction.reply({
                    embeds: [createErrorEmbed('This coupon has expired.')],
                    ephemeral: true
                });
            }
            
            if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) {
                return interaction.reply({
                    embeds: [createErrorEmbed('This coupon has reached its maximum uses.')],
                    ephemeral: true
                });
            }
            
            const existingUsage = await models.CouponUsage.findOne({
                where: {
                    couponId: coupon.couponId,
                    userId: interaction.user.id
                }
            });
            
            if (existingUsage) {
                return interaction.reply({
                    embeds: [createErrorEmbed('You have already used this coupon.')],
                    ephemeral: true
                });
            }
            
            const user = await getUser(interaction.user.id, interaction.guild.id);
            let reward = 0;
            let rewardDescription = '';
            
            if (coupon.type === 'credits') {
                reward = coupon.value;
                await addCredits(
                    interaction.user.id,
                    interaction.guild.id,
                    reward,
                    `Coupon redemption: ${code}`
                );
                rewardDescription = `${formatCredits(reward)} credits`;
            } else if (coupon.type === 'percentage') {
                rewardDescription = `${coupon.value}% discount on next purchase`;
            } else if (coupon.type === 'fixed') {
                rewardDescription = `${coupon.value} fixed amount discount`;
            }
            
            await models.CouponUsage.create({
                couponId: coupon.couponId,
                userId: interaction.user.id,
                guildId: interaction.guild.id,
                usedAt: new Date()
            });
            
            await coupon.update({
                usedCount: coupon.usedCount + 1
            });
            
            const embed = createSuccessEmbed(
                `Coupon redeemed successfully!\n\n**Code:** ${code}\n**Reward:** ${rewardDescription}\n**Description:** ${coupon.description || 'No description'}`,
                'Coupon Redeemed'
            );
            
            await interaction.reply({ embeds: [embed] });
            
        } catch (error) {
            console.error('Redeem coupon error:', error);
            await interaction.reply({
                embeds: [createErrorEmbed('Failed to redeem coupon.')],
                ephemeral: true
            });
        }
    }
};
