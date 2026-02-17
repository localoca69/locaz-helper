const { SlashCommandBuilder } = require('discord.js');
const { createEmbed } = require('../../utils/embeds');
const { getUser, formatCredits } = require('../../utils/helpers');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('balance')
        .setDescription('Check your credit balance')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('Check another user\'s balance')
                .setRequired(false)
        ),
    async execute(interaction) {
        try {
            const targetUser = interaction.options.getUser('user') || interaction.user;
            const user = await getUser(targetUser.id, interaction.guild.id);
            
            const embed = createEmbed({
                title: '💰 Credit Balance',
                description: `**${targetUser.username}**'s balance:`,
                color: 0x00AE86,
                fields: [
                    {
                        name: 'Current Balance',
                        value: formatCredits(user.credits),
                        inline: true
                    },
                    {
                        name: 'Total Earned',
                        value: formatCredits(user.totalEarned),
                        inline: true
                    },
                    {
                        name: 'Total Spent',
                        value: formatCredits(user.totalSpent),
                        inline: true
                    },
                    {
                        name: 'Level',
                        value: `Level ${user.level} (${user.experience} XP)`,
                        inline: true
                    },
                    {
                        name: 'Mystery Boxes',
                        value: `${user.mysteryBoxes} boxes`,
                        inline: true
                    },
                    {
                        name: 'Server Boosts',
                        value: `${user.boostCount} boosts`,
                        inline: true
                    }
                ],
                thumbnail: targetUser.displayAvatarURL()
            });
            
            await interaction.reply({ embeds: [embed] });
            
        } catch (error) {
            console.error('Balance command error:', error);
            await interaction.reply({
                content: 'An error occurred while fetching the balance.',
                ephemeral: true
            });
        }
    }
};
