const { SlashCommandBuilder } = require('discord.js');
const { createSuccessEmbed, createErrorEmbed, createEmbed } = require('../../utils/embeds');
const { models } = require('../../handlers/databaseHandler');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('suggest')
        .setDescription('Create a suggestion')
        .addStringOption(option =>
            option.setName('title')
                .setDescription('Suggestion title')
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('description')
                .setDescription('Detailed description of your suggestion')
                .setRequired(true)
        ),
    async execute(interaction) {
        try {
            const title = interaction.options.getString('title');
            const description = interaction.options.getString('description');
            
            const guild = await models.Guild.findByPk(interaction.guild.id);
            if (!guild || !guild.suggestionChannelId) {
                return interaction.reply({
                    embeds: [createErrorEmbed('Suggestion system is not configured.')],
                    ephemeral: true
                });
            }
            
            const suggestionNumber = await models.Suggestion.max('suggestionId') || 0;
            
            const suggestion = await models.Suggestion.create({
                guildId: interaction.guild.id,
                userId: interaction.user.id,
                title,
                description
            });
            
            const embed = createEmbed({
                title: `💡 Suggestion #${suggestion.suggestionId}`,
                description: `**${title}**\n\n${description}`,
                color: 0x00AE86,
                fields: [
                    {
                        name: 'Suggested by',
                        value: interaction.user.tag,
                        inline: true
                    },
                    {
                        name: 'Status',
                        value: '⏳ Pending Review',
                        inline: true
                    },
                    {
                        name: 'Votes',
                        value: '👍 0 | 👎 0',
                        inline: true
                    }
                ],
                footer: { text: 'Use 👍 to upvote, 👎 to downvote' }
            });
            
            try {
                const suggestionChannel = await interaction.client.channels.fetch(guild.suggestionChannelId);
                const message = await suggestionChannel.send({ embeds: [embed] });
                await message.react('👍');
                await message.react('👎');
                
                await suggestion.update({ messageId: message.id });
                
                const successEmbed = createSuccessEmbed(
                    `Your suggestion has been submitted! Suggestion #${suggestion.suggestionId}`,
                    'Suggestion Created'
                );
                
                await interaction.reply({ embeds: [successEmbed], ephemeral: true });
                
            } catch (error) {
                console.error('Error posting suggestion:', error);
                await interaction.reply({
                    embeds: [createErrorEmbed('Failed to post suggestion.')],
                    ephemeral: true
                });
            }
            
        } catch (error) {
            console.error('Suggestion command error:', error);
            await interaction.reply({
                embeds: [createErrorEmbed('Failed to create suggestion.')],
                ephemeral: true
            });
        }
    }
};
