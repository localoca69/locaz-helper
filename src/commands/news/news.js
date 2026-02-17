const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { createSuccessEmbed, createErrorEmbed, createEmbed } = require('../../utils/embeds');
const { models } = require('../../handlers/databaseHandler');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('news')
        .setDescription('Manage news and announcements')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
        .addSubcommand(subcommand =>
            subcommand
                .setName('post')
                .setDescription('Post a news announcement')
                .addStringOption(option =>
                    option.setName('title')
                        .setDescription('News title')
                        .setRequired(true)
                )
                .addStringOption(option =>
                    option.setName('content')
                        .setDescription('News content')
                        .setRequired(true)
                )
                .addStringOption(option =>
                    option.setName('category')
                        .setDescription('News category')
                        .addChoices(
                            { name: 'General', value: 'general' },
                            { name: 'Update', value: 'update' },
                            { name: 'Event', value: 'event' },
                            { name: 'Maintenance', value: 'maintenance' },
                            { name: 'Important', value: 'important' }
                        )
                        .setRequired(false)
                )
                .addStringOption(option =>
                    option.setName('image')
                        .setDescription('News image URL')
                        .setRequired(false)
                )
                .addBooleanOption(option =>
                    option.setName('ping')
                        .setDescription('Ping @everyone for this news')
                        .setRequired(false)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('setup')
                .setDescription('Setup news channel')
                .addChannelOption(option =>
                    option.setName('channel')
                        .setDescription('News announcement channel')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('schedule')
                .setDescription('Schedule a news post')
                .addStringOption(option =>
                    option.setName('title')
                        .setDescription('News title')
                        .setRequired(true)
                )
                .addStringOption(option =>
                    option.setName('content')
                        .setDescription('News content')
                        .setRequired(true)
                )
                .addStringOption(option =>
                    option.setName('time')
                        .setDescription('When to post (YYYY-MM-DD HH:MM)')
                        .setRequired(true)
                )
        ),
    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();
        
        if (subcommand === 'post') {
            await handlePost(interaction);
        } else if (subcommand === 'setup') {
            await handleSetup(interaction);
        } else if (subcommand === 'schedule') {
            await handleSchedule(interaction);
        }
    }
};

async function handlePost(interaction) {
    try {
        const title = interaction.options.getString('title');
        const content = interaction.options.getString('content');
        const category = interaction.options.getString('category') || 'general';
        const image = interaction.options.getString('image');
        const ping = interaction.options.getBoolean('ping') || false;
        
        const guild = await models.Guild.findByPk(interaction.guild.id);
        if (!guild || !guild.newsChannelId) {
            return interaction.reply({
                embeds: [createErrorEmbed('News channel not configured. Use `/news setup` first.')],
                ephemeral: true
            });
        }
        
        const categoryColors = {
            general: 0x00AE86,
            update: 0x0099FF,
            event: 0xFFD700,
            maintenance: 0xFF6600,
            important: 0xFF0000
        };
        
        const categoryEmojis = {
            general: '📢',
            update: '🔄',
            event: '🎉',
            maintenance: '🔧',
            important: '⚠️'
        };
        
        const embed = createEmbed({
            title: `${categoryEmojis[category]} ${title}`,
            description: content,
            color: categoryColors[category],
            image: image ? { url: image } : undefined,
            footer: { 
                text: `Posted by ${interaction.user.tag} • ${new Date().toLocaleDateString()}`,
                iconURL: interaction.user.displayAvatarURL()
            },
            timestamp: new Date()
        });
        
        const newsChannel = await interaction.client.channels.fetch(guild.newsChannelId);
        
        let contentText = '';
        if (ping) {
            contentText = '@everyone';
        }
        
        await newsChannel.send({ 
            content: contentText || undefined,
            embeds: [embed] 
        });
        
        const successEmbed = createSuccessEmbed(
            `News posted successfully to ${newsChannel.name}!\n\n**Title:** ${title}\n**Category:** ${category}`,
            'News Posted'
        );
        
        await interaction.reply({ embeds: [successEmbed], ephemeral: true });
        
    } catch (error) {
        console.error('Post news error:', error);
        await interaction.reply({
            embeds: [createErrorEmbed('Failed to post news.')],
            ephemeral: true
        });
    }
}

async function handleSetup(interaction) {
    try {
        const channel = interaction.options.getChannel('channel');
        
        const guild = await models.Guild.findByPk(interaction.guild.id);
        await guild.update({
            newsChannelId: channel.id
        });
        
        const embed = createSuccessEmbed(
            `News channel set to ${channel.name}!\n\nUse \`/news post\` to publish news announcements.`,
            'News Channel Setup'
        );
        
        await interaction.reply({ embeds: [embed] });
        
    } catch (error) {
        console.error('Setup news error:', error);
        await interaction.reply({
            embeds: [createErrorEmbed('Failed to setup news channel.')],
            ephemeral: true
        });
    }
}

async function handleSchedule(interaction) {
    try {
        const title = interaction.options.getString('title');
        const content = interaction.options.getString('content');
        const timeStr = interaction.options.getString('time');
        
        const scheduledTime = new Date(timeStr);
        if (isNaN(scheduledTime.getTime())) {
            return interaction.reply({
                embeds: [createErrorEmbed('Invalid date format. Use YYYY-MM-DD HH:MM.')],
                ephemeral: true
            });
        }
        
        if (scheduledTime <= new Date()) {
            return interaction.reply({
                embeds: [createErrorEmbed('Scheduled time must be in the future.')],
                ephemeral: true
            });
        }
        
        const guild = await models.Guild.findByPk(interaction.guild.id);
        if (!guild || !guild.newsChannelId) {
            return interaction.reply({
                embeds: [createErrorEmbed('News channel not configured. Use `/news setup` first.')],
                ephemeral: true
            });
        }
        
        const delay = scheduledTime.getTime() - Date.now();
        
        setTimeout(async () => {
            try {
                const embed = createEmbed({
                    title: `📢 ${title}`,
                    description: content,
                    color: 0x00AE86,
                    footer: { 
                        text: `Scheduled news • ${new Date().toLocaleDateString()}`,
                        iconURL: interaction.client.user.displayAvatarURL()
                    },
                    timestamp: new Date()
                });
                
                const newsChannel = await interaction.client.channels.fetch(guild.newsChannelId);
                await newsChannel.send({ embeds: [embed] });
                
            } catch (error) {
                console.error('Error posting scheduled news:', error);
            }
        }, delay);
        
        const embed = createSuccessEmbed(
            `News scheduled for ${scheduledTime.toLocaleString()}!\n\n**Title:** ${title}\n**Channel:** <#${guild.newsChannelId}>`,
            'News Scheduled'
        );
        
        await interaction.reply({ embeds: [embed] });
        
    } catch (error) {
        console.error('Schedule news error:', error);
        await interaction.reply({
            embeds: [createErrorEmbed('Failed to schedule news.')],
            ephemeral: true
        });
    }
}
