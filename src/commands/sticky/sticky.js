const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { createSuccessEmbed, createErrorEmbed, createEmbed } = require('../../utils/embeds');
const { models } = require('../../handlers/databaseHandler');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('sticky')
        .setDescription('Manage sticky messages')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
        .addSubcommand(subcommand =>
            subcommand
                .setName('add')
                .setDescription('Add a sticky message to this channel')
                .addStringOption(option =>
                    option.setName('message')
                        .setDescription('The sticky message content')
                        .setRequired(true)
                )
                .addIntegerOption(option =>
                    option.setName('position')
                        .setDescription('Position in the sticky list (1-10)')
                        .setMinValue(1)
                        .setMaxValue(10)
                        .setRequired(false)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('remove')
                .setDescription('Remove a sticky message')
                .addIntegerOption(option =>
                    option.setName('position')
                        .setDescription('Position of the sticky message to remove')
                        .setMinValue(1)
                        .setMaxValue(10)
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('list')
                .setDescription('List all sticky messages in this channel')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('clear')
                .setDescription('Clear all sticky messages in this channel')
        ),
    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();
        
        if (subcommand === 'add') {
            await handleAdd(interaction);
        } else if (subcommand === 'remove') {
            await handleRemove(interaction);
        } else if (subcommand === 'list') {
            await handleList(interaction);
        } else if (subcommand === 'clear') {
            await handleClear(interaction);
        }
    }
};

async function handleAdd(interaction) {
    try {
        const message = interaction.options.getString('message');
        const position = interaction.options.getInteger('position') || 1;
        
        const guild = await models.Guild.findByPk(interaction.guild.id);
        let stickyMessages = guild.stickyMessages || [];
        
        const channelStickyMessages = stickyMessages.filter(s => s.channelId === interaction.channel.id);
        
        if (channelStickyMessages.length >= 10) {
            return interaction.reply({
                embeds: [createErrorEmbed('Maximum 10 sticky messages per channel.')],
                ephemeral: true
            });
        }
        
        const newSticky = {
            channelId: interaction.channel.id,
            message,
            position,
            createdBy: interaction.user.id,
            createdAt: new Date().toISOString()
        };
        
        stickyMessages.push(newSticky);
        stickyMessages = stickyMessages.filter(s => s.channelId !== interaction.channel.id);
        stickyMessages.push(newSticky);
        
        await guild.update({ stickyMessages });
        
        const embed = createSuccessEmbed(
            `Sticky message added at position ${position} in this channel.`,
            'Sticky Message Added'
        );
        
        await interaction.reply({ embeds: [embed] });
        
        await updateStickyMessage(interaction.channel, stickyMessages.filter(s => s.channelId === interaction.channel.id));
        
    } catch (error) {
        console.error('Add sticky error:', error);
        await interaction.reply({
            embeds: [createErrorEmbed('Failed to add sticky message.')],
            ephemeral: true
        });
    }
}

async function handleRemove(interaction) {
    try {
        const position = interaction.options.getInteger('position');
        
        const guild = await models.Guild.findByPk(interaction.guild.id);
        let stickyMessages = guild.stickyMessages || [];
        
        const channelStickyMessages = stickyMessages.filter(s => s.channelId === interaction.channel.id);
        const stickyToRemove = channelStickyMessages.find(s => s.position === position);
        
        if (!stickyToRemove) {
            return interaction.reply({
                embeds: [createErrorEmbed(`No sticky message found at position ${position}.`)],
                ephemeral: true
            });
        }
        
        stickyMessages = stickyMessages.filter(s => !(s.channelId === interaction.channel.id && s.position === position));
        
        await guild.update({ stickyMessages });
        
        const embed = createSuccessEmbed(
            `Sticky message at position ${position} has been removed.`,
            'Sticky Message Removed'
        );
        
        await interaction.reply({ embeds: [embed] });
        
        await updateStickyMessage(interaction.channel, stickyMessages.filter(s => s.channelId === interaction.channel.id));
        
    } catch (error) {
        console.error('Remove sticky error:', error);
        await interaction.reply({
            embeds: [createErrorEmbed('Failed to remove sticky message.')],
            ephemeral: true
        });
    }
}

async function handleList(interaction) {
    try {
        const guild = await models.Guild.findByPk(interaction.guild.id);
        const stickyMessages = guild.stickyMessages || [];
        const channelStickyMessages = stickyMessages.filter(s => s.channelId === interaction.channel.id);
        
        if (channelStickyMessages.length === 0) {
            return interaction.reply({
                embeds: [createErrorEmbed('No sticky messages in this channel.')],
                ephemeral: true
            });
        }
        
        const sortedMessages = channelStickyMessages.sort((a, b) => a.position - b.position);
        
        const embed = createEmbed({
            title: '📌 Sticky Messages',
            description: 'All sticky messages in this channel:',
            color: 0x00AE86,
            fields: sortedMessages.map(sticky => ({
                name: `Position ${sticky.position}`,
                value: sticky.message.length > 100 ? sticky.message.substring(0, 100) + '...' : sticky.message,
                inline: false
            }))
        });
        
        await interaction.reply({ embeds: [embed] });
        
    } catch (error) {
        console.error('List sticky error:', error);
        await interaction.reply({
            embeds: [createErrorEmbed('Failed to list sticky messages.')],
            ephemeral: true
        });
    }
}

async function handleClear(interaction) {
    try {
        const guild = await models.Guild.findByPk(interaction.guild.id);
        let stickyMessages = guild.stickyMessages || [];
        
        const channelStickyCount = stickyMessages.filter(s => s.channelId === interaction.channel.id).length;
        
        if (channelStickyCount === 0) {
            return interaction.reply({
                embeds: [createErrorEmbed('No sticky messages to clear in this channel.')],
                ephemeral: true
            });
        }
        
        stickyMessages = stickyMessages.filter(s => s.channelId !== interaction.channel.id);
        
        await guild.update({ stickyMessages });
        
        const embed = createSuccessEmbed(
            `Cleared ${channelStickyCount} sticky message(s) from this channel.`,
            'Sticky Messages Cleared'
        );
        
        await interaction.reply({ embeds: [embed] });
        
        try {
            const messages = await interaction.channel.messages.fetch({ limit: 10 });
            const botMessages = messages.filter(m => m.author.id === interaction.client.user.id && m.embeds.length > 0);
            
            for (const message of botMessages.values()) {
                const embed = message.embeds[0];
                if (embed.title && embed.title.includes('Sticky Messages')) {
                    await message.delete();
                    break;
                }
            }
        } catch (error) {
            console.error('Error clearing sticky message from channel:', error);
        }
        
    } catch (error) {
        console.error('Clear sticky error:', error);
        await interaction.reply({
            embeds: [createErrorEmbed('Failed to clear sticky messages.')],
            ephemeral: true
        });
    }
}

async function updateStickyMessage(channel, stickyMessages) {
    try {
        if (stickyMessages.length === 0) return;
        
        const sortedMessages = stickyMessages.sort((a, b) => a.position - b.position);
        const messageContent = sortedMessages.map(sticky => 
            `**Position ${sticky.position}:** ${sticky.message}`
        ).join('\n\n');
        
        const embed = createEmbed({
            title: '📌 Sticky Messages',
            description: messageContent,
            color: 0x00AE86,
            footer: { text: 'These messages will stay pinned to the top of the channel' }
        });
        
        const messages = await channel.messages.fetch({ limit: 10 });
        const existingSticky = messages.find(m => 
            m.author.id === channel.client.user.id && 
            m.embeds.length > 0 && 
            m.embeds[0].title === '📌 Sticky Messages'
        );
        
        if (existingSticky) {
            await existingSticky.edit({ embeds: [embed] });
        } else {
            await channel.send({ embeds: [embed] });
        }
        
    } catch (error) {
        console.error('Error updating sticky message:', error);
    }
}
