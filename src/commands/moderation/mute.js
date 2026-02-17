const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { createSuccessEmbed, createErrorEmbed } = require('../../utils/embeds');
const { models } = require('../../handlers/databaseHandler');
const ms = require('ms');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('mute')
        .setDescription('Mute a user')
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to mute')
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('duration')
                .setDescription('Mute duration (e.g., 10m, 1h, 1d)')
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Reason for the mute')
                .setRequired(false)
        ),
    async execute(interaction) {
        try {
            const targetUser = interaction.options.getUser('user');
            const durationStr = interaction.options.getString('duration');
            const reason = interaction.options.getString('reason') || 'No reason provided';
            
            if (targetUser.id === interaction.user.id) {
                return interaction.reply({
                    embeds: [createErrorEmbed('You cannot mute yourself.')],
                    ephemeral: true
                });
            }
            
            if (targetUser.id === interaction.client.user.id) {
                return interaction.reply({
                    embeds: [createErrorEmbed('You cannot mute the bot.')],
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
            
            if (!targetMember.moderatable) {
                return interaction.reply({
                    embeds: [createErrorEmbed('I cannot mute this user. Check my permissions.')],
                    ephemeral: true
                });
            }
            
            if (interaction.member.roles.highest.position <= targetMember.roles.highest.position) {
                return interaction.reply({
                    embeds: [createErrorEmbed('You cannot mute someone with equal or higher role.')],
                    ephemeral: true
                });
            }
            
            const duration = ms(durationStr);
            if (!duration || duration < 60000 || duration > 2419200000) {
                return interaction.reply({
                    embeds: [createErrorEmbed('Duration must be between 1 minute and 28 days.')],
                    ephemeral: true
                });
            }
            
            const caseNumber = await models.ModerationLog.max('caseNumber') || 0;
            const expiresAt = new Date(Date.now() + duration);
            
            await targetMember.timeout(duration, reason);
            
            await models.ModerationLog.create({
                guildId: interaction.guild.id,
                userId: targetUser.id,
                moderatorId: interaction.user.id,
                action: 'mute',
                reason,
                duration,
                expiresAt,
                caseNumber: caseNumber + 1
            });
            
            const embed = createSuccessEmbed(
                `**${targetUser.tag}** has been muted.\n**Duration:** ${durationStr}\n**Reason:** ${reason}\n**Case:** #${caseNumber + 1}`,
                'User Muted'
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
            console.error('Mute command error:', error);
            await interaction.reply({
                embeds: [createErrorEmbed('Failed to mute user.')],
                ephemeral: true
            });
        }
    }
};
