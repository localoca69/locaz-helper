const { SlashCommandBuilder } = require('discord.js');
const { createEmbed } = require('../../utils/embeds');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Check the bot\'s latency'),
    async execute(interaction) {
        const sent = await interaction.reply({
            content: 'Pinging...',
            fetchReply: true,
            ephemeral: true
        });
        
        const timeDiff = sent.createdTimestamp - interaction.createdTimestamp;
        const apiLatency = Math.round(interaction.client.ws.ping);
        
        const embed = createEmbed({
            title: '🏓 Pong!',
            description: `**Roundtrip Latency:** ${timeDiff}ms\n**API Latency:** ${apiLatency}ms`,
            color: 0x00AE86
        });
        
        await interaction.editReply({ content: '', embeds: [embed] });
    }
};
