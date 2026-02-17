const { SlashCommandBuilder } = require('discord.js');
const { createEmbed } = require('../../utils/embeds');
const { models } = require('../../handlers/databaseHandler');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('serverinfo')
        .setDescription('Display information about the server'),
    async execute(interaction) {
        try {
            const guild = interaction.guild;
            const owner = await guild.fetchOwner();
            
            const totalMembers = guild.memberCount;
            const onlineMembers = guild.members.cache.filter(m => m.presence?.status !== 'offline').size;
            const textChannels = guild.channels.cache.filter(c => c.type === 0).size;
            const voiceChannels = guild.channels.cache.filter(c => c.type === 2).size;
            const categories = guild.channels.cache.filter(c => c.type === 4).size;
            
            const roles = guild.roles.cache.size;
            const emojis = guild.emojis.cache.size;
            const boosts = guild.premiumSubscriptionCount || 0;
            const boostLevel = guild.premiumTier;
            
            const createdAt = Math.floor(guild.createdTimestamp / 1000);
            
            const embed = createEmbed({
                title: `📊 ${guild.name} Server Information`,
                thumbnail: guild.iconURL(),
                color: 0x00AE86,
                fields: [
                    {
                        name: '👑 Server Owner',
                        value: owner.user.tag,
                        inline: true
                    },
                    {
                        name: '📅 Created On',
                        value: `<t:${createdAt}:F>`,
                        inline: true
                    },
                    {
                        name: '🆔 Server ID',
                        value: guild.id,
                        inline: true
                    },
                    {
                        name: '👥 Members',
                        value: `Total: ${totalMembers}\nOnline: ${onlineMembers}`,
                        inline: true
                    },
                    {
                        name: '💬 Channels',
                        value: `Text: ${textChannels}\nVoice: ${voiceChannels}\nCategories: ${categories}`,
                        inline: true
                    },
                    {
                        name: '🎭 Other',
                        value: `Roles: ${roles}\nEmojis: ${emojis}`,
                        inline: true
                    },
                    {
                        name: '🚀 Boosts',
                        value: `Level: ${boostLevel}\nCount: ${boosts}`,
                        inline: true
                    }
                ],
                footer: { text: `Requested by ${interaction.user.tag}` }
            });
            
            await interaction.reply({ embeds: [embed] });
            
        } catch (error) {
            console.error('Server info error:', error);
            await interaction.reply({
                content: 'Failed to fetch server information.',
                ephemeral: true
            });
        }
    }
};
