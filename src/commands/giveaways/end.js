const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { createSuccessEmbed, createErrorEmbed } = require('../../utils/embeds');
const { models } = require('../../handlers/databaseHandler');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('gend')
        .setDescription('End a giveaway and select winners')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageEvents)
        .addIntegerOption(option =>
            option.setName('giveawayid')
                .setDescription('The ID of the giveaway to end')
                .setRequired(true)
        ),
    async execute(interaction) {
        try {
            const giveawayId = interaction.options.getInteger('giveawayid');
            
            const giveaway = await models.Giveaway.findOne({
                where: {
                    giveawayId,
                    guildId: interaction.guild.id,
                    status: 'active'
                }
            });
            
            if (!giveaway) {
                return interaction.reply({
                    embeds: [createErrorEmbed('Giveaway not found or already ended.')],
                    ephemeral: true
                });
            }
            
            const entries = await models.GiveawayEntry.findAll({
                where: { giveawayId }
            });
            
            if (entries.length === 0) {
                await giveaway.update({
                    status: 'ended',
                    endedAt: new Date()
                });
                
                return interaction.reply({
                    embeds: [createErrorEmbed('No entries found for this giveaway.')],
                    ephemeral: true
                });
            }
            
            const shuffled = [...entries].sort(() => 0.5 - Math.random());
            const winners = shuffled.slice(0, giveaway.winners);
            
            const winnerIds = winners.map(w => w.userId);
            
            await giveaway.update({
                status: 'ended',
                endedAt: new Date(),
                winnerIds
            });
            
            await models.GiveawayEntry.update(
                { isWinner: true },
                { where: { giveawayId, userId: winnerIds } }
            );
            
            const winnerMentions = winners.map(w => `<@${w.userId}>`).join(', ');
            
            const embed = createSuccessEmbed(
                `**Giveaway Ended!**\n\n**Prize:** ${giveaway.prize}\n**Winners:** ${winnerMentions}\n**Total Entries:** ${entries.length}`,
                'Giveaway Results'
            );
            
            await interaction.reply({ embeds: [embed] });
            
            if (giveaway.messageId) {
                try {
                    const channel = await interaction.client.channels.fetch(giveaway.channelId);
                    const message = await channel.messages.fetch(giveaway.messageId);
                    await message.reply({ embeds: [embed] });
                } catch (error) {
                    console.error('Error updating giveaway message:', error);
                }
            }
            
        } catch (error) {
            console.error('Giveaway end error:', error);
            await interaction.reply({
                embeds: [createErrorEmbed('Failed to end giveaway.')],
                ephemeral: true
            });
        }
    }
};
