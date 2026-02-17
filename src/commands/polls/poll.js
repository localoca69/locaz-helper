const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { createSuccessEmbed, createErrorEmbed, createEmbed } = require('../../utils/embeds');
const { models } = require('../../handlers/databaseHandler');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('poll')
        .setDescription('Create a poll')
        .addStringOption(option =>
            option.setName('question')
                .setDescription('The poll question')
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('options')
                .setDescription('Poll options separated by commas (max 10)')
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('duration')
                .setDescription('Poll duration (e.g., 1h, 30m, 1d)')
                .setRequired(false)
        )
        .addBooleanOption(option =>
            option.setName('multiple')
                .setDescription('Allow multiple choices')
                .setRequired(false)
        )
        .addBooleanOption(option =>
            option.setName('anonymous')
                .setDescription('Make poll anonymous')
                .setRequired(false)
        ),
    async execute(interaction) {
        try {
            const question = interaction.options.getString('question');
            const optionsStr = interaction.options.getString('options');
            const durationStr = interaction.options.getString('duration');
            const multipleChoice = interaction.options.getBoolean('multiple') || false;
            const anonymous = interaction.options.getBoolean('anonymous') || false;
            
            const options = optionsStr.split(',').map(opt => opt.trim()).filter(opt => opt.length > 0);
            
            if (options.length < 2 || options.length > 10) {
                return interaction.reply({
                    embeds: [createErrorEmbed('Poll must have between 2 and 10 options.')],
                    ephemeral: true
                });
            }
            
            let endsAt = null;
            if (durationStr) {
                const ms = require('ms');
                const duration = ms(durationStr);
                if (!duration || duration < 60000) {
                    return interaction.reply({
                        embeds: [createErrorEmbed('Duration must be at least 1 minute.')],
                        ephemeral: true
                    });
                }
                endsAt = new Date(Date.now() + duration);
            }
            
            const poll = await models.Poll.create({
                guildId: interaction.guild.id,
                channelId: interaction.channel.id,
                creatorId: interaction.user.id,
                question,
                options: options,
                multipleChoice,
                anonymous,
                endsAt,
                results: {}
            });
            
            const embed = createEmbed({
                title: '📊 Poll',
                description: `**${question}**`,
                color: 0x00AE86,
                fields: options.map((option, index) => ({
                    name: `${String.fromCharCode(65 + index)} ${option}`,
                    value: `0 votes (0%)`,
                    inline: true
                })),
                footer: endsAt ? 
                    { text: `Ends <t:${Math.floor(endsAt.getTime() / 1000)}:R> • Poll ID: ${poll.pollId}` } :
                    { text: `Poll ID: ${poll.pollId}` }
            });
            
            const message = await interaction.reply({ 
                embeds: [embed], 
                fetchReply: true 
            });
            
            for (let i = 0; i < options.length; i++) {
                await message.react(String.fromCharCode(127462 + i));
            }
            
            await poll.update({ messageId: message.id });
            
        } catch (error) {
            console.error('Poll command error:', error);
            await interaction.reply({
                embeds: [createErrorEmbed('Failed to create poll.')],
                ephemeral: true
            });
        }
    }
};
