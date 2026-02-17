const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { createSuccessEmbed, createErrorEmbed } = require('../../utils/embeds');
const { getUser, addCredits, removeCredits, formatCredits } = require('../../utils/helpers');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('addcredits')
        .setDescription('Add credits to a user account')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to add credits to')
                .setRequired(true)
        )
        .addIntegerOption(option =>
            option.setName('amount')
                .setDescription('Amount of credits to add')
                .setMinValue(1)
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Reason for adding credits')
                .setRequired(false)
        ),
    async execute(interaction) {
        try {
            const targetUser = interaction.options.getUser('user');
            const amount = interaction.options.getInteger('amount');
            const reason = interaction.options.getString('reason') || 'Admin addition';
            
            const newBalance = await addCredits(
                targetUser.id,
                interaction.guild.id,
                amount,
                `${reason} - Added by ${interaction.user.tag}`
            );
            
            const embed = createSuccessEmbed(
                `Added ${formatCredits(amount)} to **${targetUser.tag}**\nNew balance: ${formatCredits(newBalance)}\nReason: ${reason}`,
                'Credits Added'
            );
            
            await interaction.reply({ embeds: [embed] });
            
        } catch (error) {
            console.error('Add credits error:', error);
            await interaction.reply({
                embeds: [createErrorEmbed('Failed to add credits.')],
                ephemeral: true
            });
        }
    }
};
