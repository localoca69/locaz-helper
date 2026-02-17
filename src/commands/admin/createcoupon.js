const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { createSuccessEmbed, createErrorEmbed } = require('../../utils/embeds');
const { models } = require('../../handlers/databaseHandler');
const { generateId } = require('../../utils/helpers');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('createcoupon')
        .setDescription('Create a new coupon')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addStringOption(option =>
            option.setName('code')
                .setDescription('Coupon code (leave empty for random)')
                .setRequired(false)
        )
        .addStringOption(option =>
            option.setName('type')
                .setDescription('Coupon type')
                .addChoices(
                    { name: 'Percentage Discount', value: 'percentage' },
                    { name: 'Fixed Amount', value: 'fixed' },
                    { name: 'Credits', value: 'credits' }
                )
                .setRequired(true)
        )
        .addIntegerOption(option =>
            option.setName('value')
                .setDescription('Coupon value')
                .setMinValue(1)
                .setRequired(true)
        )
        .addIntegerOption(option =>
            option.setName('maxuses')
                .setDescription('Maximum uses (leave empty for unlimited)')
                .setMinValue(1)
                .setRequired(false)
        )
        .addStringOption(option =>
            option.setName('description')
                .setDescription('Coupon description')
                .setRequired(false)
        )
        .addStringOption(option =>
            option.setName('expires')
                .setDescription('Expiration date (YYYY-MM-DD)')
                .setRequired(false)
        )
        .addBooleanOption(option =>
            option.setName('global')
                .setDescription('Make this a global coupon')
                .setRequired(false)
        ),
    async execute(interaction) {
        try {
            let code = interaction.options.getString('code');
            const type = interaction.options.getString('type');
            const value = interaction.options.getInteger('value');
            const maxUses = interaction.options.getInteger('maxuses');
            const description = interaction.options.getString('description');
            const expiresStr = interaction.options.getString('expires');
            const isGlobal = interaction.options.getBoolean('global') || false;
            
            if (!code) {
                code = generateId().toUpperCase().substring(0, 8);
            }
            
            const existingCoupon = await models.Coupon.findOne({
                where: { code: code.toUpperCase() }
            });
            
            if (existingCoupon) {
                return interaction.reply({
                    embeds: [createErrorEmbed('A coupon with this code already exists.')],
                    ephemeral: true
                });
            }
            
            let expiresAt = null;
            if (expiresStr) {
                expiresAt = new Date(expiresStr);
                if (isNaN(expiresAt.getTime())) {
                    return interaction.reply({
                        embeds: [createErrorEmbed('Invalid expiration date format. Use YYYY-MM-DD.')],
                        ephemeral: true
                    });
                }
            }
            
            await models.Coupon.create({
                guildId: isGlobal ? 'global' : interaction.guild.id,
                code: code.toUpperCase(),
                type,
                value,
                description,
                maxUses,
                expiresAt,
                createdBy: interaction.user.id,
                isGlobal
            });
            
            const embed = createSuccessEmbed(
                `Coupon created successfully!\n\n**Code:** ${code.toUpperCase()}\n**Type:** ${type}\n**Value:** ${value}${type === 'percentage' ? '%' : type === 'credits' ? ' credits' : ''}\n**Max Uses:** ${maxUses || 'Unlimited'}\n**Expires:** ${expiresAt ? expiresAt.toDateString() : 'Never'}\n**Global:** ${isGlobal ? 'Yes' : 'No'}`,
                'Coupon Created'
            );
            
            await interaction.reply({ embeds: [embed] });
            
        } catch (error) {
            console.error('Create coupon error:', error);
            await interaction.reply({
                embeds: [createErrorEmbed('Failed to create coupon.')],
                ephemeral: true
            });
        }
    }
};
