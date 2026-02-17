const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { createSuccessEmbed, createErrorEmbed } = require('../../utils/embeds');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('embed')
        .setDescription('Create and send custom embeds')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
        .addSubcommand(subcommand =>
            subcommand
                .setName('create')
                .setDescription('Create a new embed')
                .addStringOption(option =>
                    option.setName('title')
                        .setDescription('Embed title')
                        .setRequired(false)
                )
                .addStringOption(option =>
                    option.setName('description')
                        .setDescription('Embed description')
                        .setRequired(false)
                )
                .addStringOption(option =>
                    option.setName('color')
                        .setDescription('Embed color (hex code)')
                        .setRequired(false)
                )
                .addStringOption(option =>
                    option.setName('thumbnail')
                        .setDescription('Thumbnail URL')
                        .setRequired(false)
                )
                .addStringOption(option =>
                    option.setName('image')
                        .setDescription('Image URL')
                        .setRequired(false)
                )
                .addStringOption(option =>
                    option.setName('footer')
                        .setDescription('Footer text')
                        .setRequired(false)
                )
                .addStringOption(option =>
                    option.setName('author')
                        .setDescription('Author text')
                        .setRequired(false)
                )
                .addStringOption(option =>
                    option.setName('url')
                        .setDescription('URL for title link')
                        .setRequired(false)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('json')
                .setDescription('Create embed from JSON')
                .addStringOption(option =>
                    option.setName('data')
                        .setDescription('JSON embed data')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('template')
                .setDescription('Use predefined templates')
                .addStringOption(option =>
                    option.setName('type')
                        .setDescription('Template type')
                        .addChoices(
                            { name: 'Welcome', value: 'welcome' },
                            { name: 'Rules', value: 'rules' },
                            { name: 'Announcement', value: 'announcement' },
                            { name: 'Goodbye', value: 'goodbye' }
                        )
                        .setRequired(true)
                )
        ),
    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();
        
        if (subcommand === 'create') {
            await handleCreate(interaction);
        } else if (subcommand === 'json') {
            await handleJson(interaction);
        } else if (subcommand === 'template') {
            await handleTemplate(interaction);
        }
    }
};

async function handleCreate(interaction) {
    try {
        const title = interaction.options.getString('title');
        const description = interaction.options.getString('description');
        const color = interaction.options.getString('color');
        const thumbnail = interaction.options.getString('thumbnail');
        const image = interaction.options.getString('image');
        const footer = interaction.options.getString('footer');
        const author = interaction.options.getString('author');
        const url = interaction.options.getString('url');
        
        if (!title && !description) {
            return interaction.reply({
                embeds: [createErrorEmbed('You must provide at least a title or description.')],
                ephemeral: true
            });
        }
        
        const embed = new EmbedBuilder();
        
        if (title) embed.setTitle(title);
        if (description) embed.setDescription(description);
        if (url) embed.setURL(url);
        if (color) {
            const colorCode = color.startsWith('#') ? color.substring(1) : color;
            embed.setColor(parseInt(colorCode, 16));
        } else {
            embed.setColor(0x00AE86);
        }
        if (thumbnail) embed.setThumbnail(thumbnail);
        if (image) embed.setImage(image);
        if (footer) embed.setFooter({ text: footer });
        if (author) embed.setAuthor({ name: author });
        embed.setTimestamp();
        
        await interaction.reply({ embeds: [embed] });
        
    } catch (error) {
        console.error('Create embed error:', error);
        await interaction.reply({
            embeds: [createErrorEmbed('Failed to create embed. Check your input and try again.')],
            ephemeral: true
        });
    }
}

async function handleJson(interaction) {
    try {
        const jsonData = interaction.options.getString('data');
        
        let embedData;
        try {
            embedData = JSON.parse(jsonData);
        } catch (parseError) {
            return interaction.reply({
                embeds: [createErrorEmbed('Invalid JSON format.')],
                ephemeral: true
            });
        }
        
        const embed = new EmbedBuilder(embedData);
        
        if (!embed.data.title && !embed.data.description) {
            return interaction.reply({
                embeds: [createErrorEmbed('Embed must have at least a title or description.')],
                ephemeral: true
            });
        }
        
        await interaction.reply({ embeds: [embed] });
        
    } catch (error) {
        console.error('JSON embed error:', error);
        await interaction.reply({
            embeds: [createErrorEmbed('Failed to create embed from JSON.')],
            ephemeral: true
        });
    }
}

async function handleTemplate(interaction) {
    try {
        const templateType = interaction.options.getString('type');
        
        const templates = {
            welcome: {
                title: '👋 Welcome to the Server!',
                description: 'We\'re excited to have you here! Please take a moment to read our rules and introduce yourself.',
                color: 0x00AE86,
                thumbnail: interaction.guild.iconURL(),
                footer: { text: `Welcome to ${interaction.guild.name}` }
            },
            rules: {
                title: '📋 Server Rules',
                description: '1. Be respectful to all members\n2. No spam or self-promotion\n3. Keep discussions appropriate\n4. Follow Discord\'s Terms of Service\n5. Listen to staff members',
                color: 0xFF0000,
                footer: { text: 'Failure to follow these rules may result in consequences' }
            },
            announcement: {
                title: '📢 Important Announcement',
                description: 'Please read this important announcement carefully. This message contains information that affects all server members.',
                color: 0xFFD700,
                author: { name: 'Server Management' },
                footer: { text: 'Posted by Server Staff' }
            },
            goodbye: {
                title: '👋 Goodbye!',
                description: 'We\'re sad to see you go. Thank you for being part of our community. You\'re always welcome back!',
                color: 0x808080,
                footer: { text: `From ${interaction.guild.name}` }
            }
        };
        
        const template = templates[templateType];
        if (!template) {
            return interaction.reply({
                embeds: [createErrorEmbed('Template not found.')],
                ephemeral: true
            });
        }
        
        const embed = new EmbedBuilder(template);
        embed.setTimestamp();
        
        await interaction.reply({ embeds: [embed] });
        
    } catch (error) {
        console.error('Template embed error:', error);
        await interaction.reply({
            embeds: [createErrorEmbed('Failed to create template embed.')],
            ephemeral: true
        });
    }
}
