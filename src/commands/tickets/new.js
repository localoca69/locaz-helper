const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { createSuccessEmbed, createErrorEmbed } = require('../../utils/embeds');
const { models } = require('../../handlers/databaseHandler');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('new')
        .setDescription('Create a new support ticket')
        .addStringOption(option =>
            option.setName('subject')
                .setDescription('Ticket subject')
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('category')
                .setDescription('Ticket category')
                .addChoices(
                    { name: 'General Support', value: 'general' },
                    { name: 'Bug Report', value: 'bug' },
                    { name: 'Account Issue', value: 'account' },
                    { name: 'Feature Request', value: 'feature' },
                    { name: 'Other', value: 'other' }
                )
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('description')
                .setDescription('Detailed description of your issue')
                .setRequired(false)
        ),
    async execute(interaction) {
        try {
            const subject = interaction.options.getString('subject');
            const category = interaction.options.getString('category');
            const description = interaction.options.getString('description') || 'No description provided';
            
            const guild = await models.Guild.findByPk(interaction.guild.id);
            if (!guild || !guild.ticketCategoryId) {
                return interaction.reply({
                    embeds: [createErrorEmbed('Ticket system is not configured.')],
                    ephemeral: true
                });
            }
            
            const existingTicket = await models.Ticket.findOne({
                where: {
                    userId: interaction.user.id,
                    guildId: interaction.guild.id,
                    status: 'open'
                }
            });
            
            if (existingTicket) {
                return interaction.reply({
                    embeds: [createErrorEmbed('You already have an open ticket.')],
                    ephemeral: true
                });
            }
            
            const ticketNumber = await models.Ticket.max('ticketId') || 0;
            const channelName = `ticket-${ticketNumber + 1}-${interaction.user.username}`;
            
            const categoryChannel = await interaction.guild.channels.fetch(guild.ticketCategoryId);
            const ticketChannel = await interaction.guild.channels.create({
                name: channelName,
                type: 0,
                parent: categoryChannel,
                permissionOverwrites: [
                    {
                        id: interaction.guild.id,
                        deny: ['ViewChannel']
                    },
                    {
                        id: interaction.user.id,
                        allow: ['ViewChannel', 'SendMessages', 'AttachFiles']
                    }
                ]
            });
            
            if (guild.supportRoleId) {
                ticketChannel.permissionOverwrites.edit(guild.supportRoleId, {
                    ViewChannel: true,
                    SendMessages: true
                });
            }
            
            const ticket = await models.Ticket.create({
                guildId: interaction.guild.id,
                userId: interaction.user.id,
                channelId: ticketChannel.id,
                category,
                subject,
                description
            });
            
            const embed = createSuccessEmbed(
                `Ticket created successfully! Your ticket number is #${ticket.ticketId}`,
                'Ticket Created'
            );
            
            await interaction.reply({ embeds: [embed], ephemeral: true });
            
            const ticketEmbed = createEmbed({
                title: `🎫 Ticket #${ticket.ticketId}`,
                description: `**Subject:** ${subject}\n**Category:** ${category}\n**Description:** ${description}`,
                color: 0x00AE86,
                fields: [
                    { name: 'Created by', value: interaction.user.tag, inline: true },
                    { name: 'Status', value: 'Open', inline: true }
                ]
            });
            
            await ticketChannel.send({ embeds: [ticketEmbed] });
            
        } catch (error) {
            console.error('New ticket error:', error);
            await interaction.reply({
                embeds: [createErrorEmbed('Failed to create ticket.')],
                ephemeral: true
            });
        }
    }
};
