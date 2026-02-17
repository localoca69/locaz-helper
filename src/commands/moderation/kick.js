const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { createSuccessEmbed, createErrorEmbed } = require('../../utils/embeds');
const { models } = require('../../handlers/databaseHandler');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('kick')
        .setDescription('Kick a user from the server')
        .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers)
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to kick')
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Reason for the kick')
                .setRequired(false)
        ),
    async execute(interaction) {
        try {
            const targetUser = interaction.options.getUser('user');
            const reason = interaction.options.getString('reason') || 'No reason provided';
            
            if (targetUser.id === interaction.user.id) {
                return interaction.reply({
                    embeds: [createErrorEmbed('You cannot kick yourself.')],
                    ephemeral: true
                });
            }
            
            if (targetUser.id === interaction.client.user.id) {
                return interaction.reply({
                    embeds: [createErrorEmbed('You cannot kick the bot.')],
                    ephemeral: true
                });
            }
            
            const targetMember = await interaction.guild.members.fetch(targetUser.id).catch(() => null);
            
            if (!targetMember) {
                return interaction.reply({
                    embeds: [createErrorEmbed('User not found in server.')],
                    ephemeral: true
                });
            }
            
            if (!targetMember.kickable) {
                return interaction.reply({
                    embeds: [createErrorEmbed('I cannot kick this user. Check my permissions.')],
                    ephemeral: true
                });
            }
            
            if (interaction.member.roles.highest.position <= targetMember.roles.highest.position) {
                return interaction.reply({
                    embeds: [createErrorEmbed('You cannot kick someone with equal or higher role.')],
                    ephemeral: true
                });
            }
            
            const caseNumber = await models.ModerationLog.max('caseNumber') || 0;
            
            await targetMember.kick(reason);
            
            await models.ModerationLog.create({
                guildId: interaction.guild.id,
                userId: targetUser.id,
                moderatorId: interaction.user.id,
                action: 'kick',
                reason,
                caseNumber: caseNumber + 1
            });
            
            const embed = createSuccessEmbed(
                `**${targetUser.tag}** has been kicked.\n**Reason:** ${reason}\n**Case:** #${caseNumber + 1}`,
                'User Kicked'
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
            console.error('Kick command error:', error);
            await interaction.reply({
                embeds: [createErrorEmbed('Failed to kick user.')],
                ephemeral: true
            });
        }
    }
};
