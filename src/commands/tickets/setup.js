const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { createSuccessEmbed, createErrorEmbed } = require('../../utils/embeds');
const { models } = require('../../handlers/databaseHandler');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ticketsetup')
        .setDescription('Configure the ticket system')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addChannelOption(option =>
            option.setName('category')
                .setDescription('Category for ticket channels')
                .setRequired(true)
        )
        .addChannelOption(option =>
            option.setName('logchannel')
                .setDescription('Channel for ticket logs')
                .setRequired(false)
        )
        .addRoleOption(option =>
            option.setName('supportrole')
                .setDescription('Role that can view tickets')
                .setRequired(false)
        ),
    async execute(interaction) {
        try {
            const category = interaction.options.getChannel('category');
            const logChannel = interaction.options.getChannel('logchannel');
            const supportRole = interaction.options.getRole('supportrole');
            
            if (category.type !== 4) {
                return interaction.reply({
                    embeds: [createErrorEmbed('The category must be a channel category.')],
                    ephemeral: true
                });
            }
            
            const guild = await models.Guild.findByPk(interaction.guild.id);
            if (!guild) {
                return interaction.reply({
                    embeds: [createErrorEmbed('Guild not found in database.')],
                    ephemeral: true
                });
            }
            
            await guild.update({
                ticketCategoryId: category.id,
                ticketLogChannelId: logChannel?.id || null,
                supportRoleId: supportRole?.id || null
            });
            
            const embed = createSuccessEmbed(
                `Ticket system configured successfully!\n\n**Category:** ${category.name}\n**Log Channel:** ${logChannel?.name || 'None'}\n**Support Role:** ${supportRole?.name || 'None'}`,
                'Ticket System Setup'
            );
            
            await interaction.reply({ embeds: [embed] });
            
        } catch (error) {
            console.error('Ticket setup error:', error);
            await interaction.reply({
                embeds: [createErrorEmbed('Failed to setup ticket system.')],
                ephemeral: true
            });
        }
    }
};
