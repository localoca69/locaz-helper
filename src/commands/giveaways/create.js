const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { createSuccessEmbed, createErrorEmbed, createEmbed } = require('../../utils/embeds');
const { models } = require('../../handlers/databaseHandler');
const ms = require('ms');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('gcreate')
        .setDescription('Create a new giveaway')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageEvents)
        .addStringOption(option =>
            option.setName('duration')
                .setDescription('Giveaway duration (e.g., 1h, 30m, 7d)')
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('prize')
                .setDescription('The prize for the giveaway')
                .setRequired(true)
        )
        .addIntegerOption(option =>
            option.setName('winners')
                .setDescription('Number of winners')
                .setMinValue(1)
                .setMaxValue(10)
                .setRequired(false)
        )
        .addStringOption(option =>
            option.setName('description')
                .setDescription('Additional description for the giveaway')
                .setRequired(false)
        ),
    async execute(interaction) {
        try {
            const durationStr = interaction.options.getString('duration');
            const prize = interaction.options.getString('prize');
            const winners = interaction.options.getInteger('winners') || 1;
            const description = interaction.options.getString('description');
            
            const duration = ms(durationStr);
            if (!duration || duration < 60000) {
                return interaction.reply({
                    embeds: [createErrorEmbed('Duration must be at least 1 minute.')],
                    ephemeral: true
                });
            }
            
            const endsAt = new Date(Date.now() + duration);
            
            const giveaway = await models.Giveaway.create({
                guildId: interaction.guild.id,
                channelId: interaction.channel.id,
                hostId: interaction.user.id,
                prize,
                description,
                winners,
                duration,
                endsAt
            });
            
            const embed = createEmbed({
                title: '🎉 Giveaway!',
                description: `**Prize:** ${prize}\n${description ? `**Description:** ${description}\n` : ''}**Winners:** ${winners}\n**Ends:** <t:${Math.floor(endsAt.getTime() / 1000)}:R>\n\nClick the 🎉 reaction to enter!`,
                color: 0x00AE86,
                footer: { text: `Giveaway ID: ${giveaway.giveawayId}` }
            });
            
            const message = await interaction.channel.send({ embeds: [embed] });
            await message.react('🎉');
            
            await giveaway.update({ messageId: message.id });
            
            await interaction.reply({
                embeds: [createSuccessEmbed(`Giveaway created successfully! Giveaway ID: ${giveaway.giveawayId}`)],
                ephemeral: true
            });
            
        } catch (error) {
            console.error('Giveaway create error:', error);
            await interaction.reply({
                embeds: [createErrorEmbed('Failed to create giveaway.')],
                ephemeral: true
            });
        }
    }
};
