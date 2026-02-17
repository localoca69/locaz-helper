const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { createSuccessEmbed, createErrorEmbed } = require('../../utils/embeds');
const { models } = require('../../handlers/databaseHandler');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ban')
        .setDescription('Ban a user from the server')
        .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to ban')
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Reason for the ban')
                .setRequired(false)
        )
        .addIntegerOption(option =>
            option.setName('days')
                .setDescription('Days of messages to delete (0-7)')
                .setMinValue(0)
                .setMaxValue(7)
                .setRequired(false)
        ),
    async execute(interaction) {
        try {
            const targetUser = interaction.options.getUser('user');
            const reason = interaction.options.getString('reason') || 'No reason provided';
            const days = interaction.options.getInteger('days') || 0;
            
            if (targetUser.id === interaction.user.id) {
                return interaction.reply({
                    embeds: [createErrorEmbed('You cannot ban yourself.')],
                    ephemeral: true
                });
            }
            
            if (targetUser.id === interaction.client.user.id) {
                return interaction.reply({
                    embeds: [createErrorEmbed('You cannot ban the bot.')],
                    ephemeral: true
                });
            }
            
            const targetMember = await interaction.guild.members.fetch(targetUser.id).catch(() => null);
            
            if (targetMember) {
                if (!targetMember.bannable) {
                    return interaction.reply({
                        embeds: [createErrorEmbed('I cannot ban this user. Check my permissions.')],
                        ephemeral: true
                    });
                }
                
                if (interaction.member.roles.highest.position <= targetMember.roles.highest.position) {
                    return interaction.reply({
                        embeds: [createErrorEmbed('You cannot ban someone with equal or higher role.')],
                        ephemeral: true
                    });
                }
            }
            
            const caseNumber = await models.ModerationLog.max('caseNumber') || 0;
            
            await interaction.guild.bans.create(targetUser.id, {
                reason,
                deleteMessageDays: days
            });
            
            await models.ModerationLog.create({
                guildId: interaction.guild.id,
                userId: targetUser.id,
                moderatorId: interaction.user.id,
                action: 'ban',
                reason,
                caseNumber: caseNumber + 1
            });
            
            const embed = createSuccessEmbed(
                `**${targetUser.tag}** has been banned.\n**Reason:** ${reason}\n**Case:** #${caseNumber + 1}`,
                'User Banned'
            );
            
            await interaction.reply({ embeds: [embed] });
            
            const guild = await models.Guild.findByPk(interaction.guild.id);
            if (guild && guild.modLogChannelId) {
                try {
                    const logChannel = await interaction.client.channels.fetch(guild.modLogChannelId);
                    await logChannel.send({ embeds: [embed] });
                } catch (error) {
                    console.error('Error sending to mod log channel:', error);
                }
            }
            
        } catch (error) {
            console.error('Ban command error:', error);
            await interaction.reply({
                embeds: [createErrorEmbed('Failed to ban user.')],
                ephemeral: true
            });
        }
    }
};
