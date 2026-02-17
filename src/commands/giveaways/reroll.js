const { SlashCommandBuilder } = require('discord.js');
const { createEmbed } = require('../../utils/embeds');
const { models } = require('../../handlers/databaseHandler');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('greroll')
        .setDescription('Reroll a giveaway to select new winners')
        .addIntegerOption(option =>
            option.setName('giveawayid')
                .setDescription('The ID of the giveaway to reroll')
                .setRequired(true)
        ),
    async execute(interaction) {
        try {
            const giveawayId = interaction.options.getInteger('giveawayid');
            
            const giveaway = await models.Giveaway.findOne({
                where: {
                    giveawayId,
                    guildId: interaction.guild.id,
                    status: 'ended'
                }
            });
            
            if (!giveaway) {
                return interaction.reply({
                    embeds: [createErrorEmbed('Giveaway not found or not ended.')],
                    ephemeral: true
                });
            }
            
            const entries = await models.GiveawayEntry.findAll({
                where: { giveawayId, isWinner: false }
            });
            
            if (entries.length === 0) {
                return interaction.reply({
                    embeds: [createErrorEmbed('No remaining entries to reroll.')],
                    ephemeral: true
                });
            }
            
            const shuffled = [...entries].sort(() => 0.5 - Math.random());
            const newWinners = shuffled.slice(0, giveaway.winners);
            
            const newWinnerIds = newWinners.map(w => w.userId);
            
            await models.GiveawayEntry.update(
                { isWinner: false },
                { where: { giveawayId, isWinner: true } }
            );
            
            await models.GiveawayEntry.update(
                { isWinner: true },
                { where: { giveawayId, userId: newWinnerIds } }
            );
            
            await giveaway.update({ winnerIds: newWinnerIds });
            
            const winnerMentions = newWinners.map(w => `<@${w.userId}>`).join(', ');
            
            const embed = createEmbed({
                title: '🎉 Giveaway Rerolled!',
                description: `**Prize:** ${giveaway.prize}\n**New Winners:** ${winnerMentions}\n**Total Entries:** ${entries.length + giveaway.winners}`,
                color: 0x00AE86
            });
            
            await interaction.reply({ embeds: [embed] });
            
        } catch (error) {
            console.error('Giveaway reroll error:', error);
            await interaction.reply({
                embeds: [createErrorEmbed('Failed to reroll giveaway.')],
                ephemeral: true
            });
        }
    }
};
