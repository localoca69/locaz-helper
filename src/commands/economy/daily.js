const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { createSuccessEmbed, createErrorEmbed } = require('../../utils/embeds');
const { getUser, addCredits, formatCredits } = require('../../utils/helpers');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('daily')
        .setDescription('Claim your daily credits'),
    async execute(interaction) {
        try {
            const user = await getUser(interaction.user.id, interaction.guild.id);
            const now = new Date();
            const lastDaily = user.lastDaily ? new Date(user.lastDaily) : null;
            
            if (lastDaily) {
                const timeDiff = now - lastDaily;
                const hoursDiff = timeDiff / (1000 * 60 * 60);
                
                if (hoursDiff < 24) {
                    const hoursLeft = 24 - hoursDiff;
                    const hours = Math.floor(hoursLeft);
                    const minutes = Math.floor((hoursLeft - hours) * 60);
                    
                    return interaction.reply({
                        embeds: [createErrorEmbed(
                            `You can claim your daily credits again in **${hours}h ${minutes}m**`,
                            'Daily Claim Not Available'
                        )],
                        ephemeral: true
                    });
                }
            }
            
            const dailyAmount = parseInt(process.env.DAILY_CREDIT_AMOUNT) || 50;
            const newBalance = await addCredits(
                interaction.user.id,
                interaction.guild.id,
                dailyAmount,
                'Daily reward claim'
            );
            
            await user.update({ lastDaily: now });
            
            await interaction.reply({
                embeds: [createSuccessEmbed(
                    `You have claimed **${formatCredits(dailyAmount)}**!\nYour new balance is **${formatCredits(newBalance)}**`,
                    'Daily Claim Successful'
                )]
            });
            
        } catch (error) {
            console.error('Daily command error:', error);
            await interaction.reply({
                embeds: [createErrorEmbed('An error occurred while processing your daily claim.')],
                ephemeral: true
            });
        }
    }
};
