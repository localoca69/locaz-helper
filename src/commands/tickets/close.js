const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { createSuccessEmbed, createErrorEmbed } = require('../../utils/embeds');
const { models } = require('../../handlers/databaseHandler');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('close')
        .setDescription('Close a support ticket')
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Reason for closing the ticket')
                .setRequired(false)
        ),
    async execute(interaction) {
        try {
            const reason = interaction.options.getString('reason') || 'Ticket closed by user';
            
            const ticket = await models.Ticket.findOne({
                where: {
                    channelId: interaction.channel.id,
                    guildId: interaction.guild.id,
                    status: 'open'
                }
            });
            
            if (!ticket) {
                return interaction.reply({
                    embeds: [createErrorEmbed('This is not an open ticket channel.')],
                    ephemeral: true
                });
            }
            
            const isTicketOwner = ticket.userId === interaction.user.id;
            const hasPermission = interaction.member.permissions.has(PermissionFlagsBits.ManageChannels);
            
            if (!isTicketOwner && !hasPermission) {
                return interaction.reply({
                    embeds: [createErrorEmbed('You can only close your own tickets.')],
                    ephemeral: true
                });
            }
            
            await ticket.update({
                status: 'closed',
                closedBy: interaction.user.id,
                closedAt: new Date(),
                closeReason: reason
            });
            
            const embed = createSuccessEmbed(
                `Ticket #${ticket.ticketId} has been closed.\n**Reason:** ${reason}`,
                'Ticket Closed'
            );
            
            await interaction.reply({ embeds: [embed] });
            
            setTimeout(async () => {
                try {
                    await interaction.channel.delete();
                } catch (error) {
                    console.error('Error deleting ticket channel:', error);
                }
            }, 5000);
            
        } catch (error) {
            console.error('Close ticket error:', error);
            await interaction.reply({
                embeds: [createErrorEmbed('Failed to close ticket.')],
                ephemeral: true
            });
        }
    }
};
