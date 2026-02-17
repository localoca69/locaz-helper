const { SlashCommandBuilder } = require('discord.js');
const { createEmbed } = require('../../utils/embeds');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Get help with the bot commands'),
    async execute(interaction) {
        const embed = createEmbed({
            title: '🤖 Discord Helper Bot - Help',
            description: 'Here are all the available commands:',
            color: 0x00AE86,
            fields: [
                {
                    name: '🎫 Ticket Commands',
                    value: '`/new` - Create a new support ticket\n`/close` - Close a ticket\n`/ticketsetup` - Configure ticket system',
                    inline: false
                },
                {
                    name: '🎉 Giveaway Commands',
                    value: '`/gcreate` - Create a new giveaway\n`/gend` - End a giveaway\n`/greroll` - Reroll a giveaway',
                    inline: false
                },
                {
                    name: '💰 Economy Commands',
                    value: '`/balance` - Check your balance\n`/daily` - Claim daily credits\n`/redeem` - Redeem a coupon code',
                    inline: false
                },
                {
                    name: '🔨 Moderation Commands',
                    value: '`/ban` - Ban a user\n`/kick` - Kick a user\n`/mute` - Mute a user',
                    inline: false
                },
                {
                    name: '🎁 Mystery Box Commands',
                    value: '`/mysterybox buy` - Buy mystery boxes\n`/mysterybox open` - Open mystery boxes\n`/mysterybox inventory` - View inventory',
                    inline: false
                },
                {
                    name: 'ℹ️ Utility Commands',
                    value: '`/help` - Show this help message\n`/ping` - Check bot latency\n`/serverinfo` - Server information',
                    inline: false
                },
                {
                    name: '⬇️ Dropdown / Roles',
                    value: '`/roleselect create` - Create a role dropdown\n`/roleselect disable` - Disable a role dropdown',
                    inline: false
                },
                {
                    name: '🏷️ TagHype',
                    value: '`/taghype setup` - Configure tag role + credits\n`/taghype status` - View TagHype status\n`/taghype disable` - Disable TagHype',
                    inline: false
                }
            ],
            footer: { text: 'Use !help for prefix commands or / for slash commands' }
        });
        
        await interaction.reply({ embeds: [embed] });
    }
};
