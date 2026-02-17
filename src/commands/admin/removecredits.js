const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { createSuccessEmbed, createErrorEmbed } = require('../../utils/embeds');
const { getUser, removeCredits, formatCredits } = require('../../utils/helpers');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('removecredits')
        .setDescription('Remove credits from a user account')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to remove credits from')
                .setRequired(true)
        )
        .addIntegerOption(option =>
            option.setName('amount')
                .setDescription('Amount of credits to remove')
                .setMinValue(1)
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Reason for removing credits')
                .setRequired(false)
        ),
    async execute(interaction) {
        try {
            const targetUser = interaction.options.getUser('user');
            const amount = interaction.options.getInteger('amount');
            const reason = interaction.options.getString('reason') || 'Admin removal';
            
            const newBalance = await removeCredits(
                targetUser.id,
                interaction.guild.id,
                amount,
                `${reason} - Removed by ${interaction.user.tag}`
            );
            
            const embed = createSuccessEmbed(
                `Removed ${formatCredits(amount)} from **${targetUser.tag}**\nNew balance: ${formatCredits(newBalance)}\nReason: ${reason}`,
                'Credits Removed'
            );
            
            await interaction.reply({ embeds: [embed] });
            
        } catch (error) {
            console.error('Remove credits error:', error);
            await interaction.reply({
                embeds: [createErrorEmbed('Failed to remove credits.')],
                ephemeral: true
            });
        }
    }
};
