const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { createSuccessEmbed, createErrorEmbed } = require('../../utils/embeds');
const { models } = require('../../handlers/databaseHandler');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setup')
        .setDescription('Configure bot settings')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addSubcommand(subcommand =>
            subcommand
                .setName('welcome')
                .setDescription('Setup welcome messages')
                .addChannelOption(option =>
                    option.setName('channel')
                        .setDescription('Welcome channel')
                        .setRequired(true)
                )
                .addStringOption(option =>
                    option.setName('message')
                        .setDescription('Welcome message (use {user}, {server}, {count})')
                        .setRequired(false)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('autorole')
                .setDescription('Setup auto roles')
                .addRoleOption(option =>
                    option.setName('role')
                        .setDescription('Role to assign on join')
                        .setRequired(true)
                )
                .addStringOption(option =>
                    option.setName('action')
                        .setDescription('Add or remove role')
                        .addChoices(
                            { name: 'Add', value: 'add' },
                            { name: 'Remove', value: 'remove' }
                        )
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('suggestions')
                .setDescription('Setup suggestion channel')
                .addChannelOption(option =>
                    option.setName('channel')
                        .setDescription('Suggestion channel')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('modlog')
                .setDescription('Setup moderation log channel')
                .addChannelOption(option =>
                    option.setName('channel')
                        .setDescription('Moderation log channel')
                        .setRequired(true)
                )
        ),
    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();
        
        if (subcommand === 'welcome') {
            await handleWelcome(interaction);
        } else if (subcommand === 'autorole') {
            await handleAutoRole(interaction);
        } else if (subcommand === 'suggestions') {
            await handleSuggestions(interaction);
        } else if (subcommand === 'modlog') {
            await handleModLog(interaction);
        }
    }
};

async function handleWelcome(interaction) {
    try {
        const channel = interaction.options.getChannel('channel');
        const message = interaction.options.getString('message') || 'Welcome {user} to {server}!';
        
        const guild = await models.Guild.findByPk(interaction.guild.id);
        await guild.update({
            welcomeChannelId: channel.id,
            welcomeMessage: message,
            welcomeEnabled: true
        });
        
        const embed = createSuccessEmbed(
            `Welcome system configured!\n\n**Channel:** ${channel.name}\n**Message:** ${message}`,
            'Welcome Setup Complete'
        );
        
        await interaction.reply({ embeds: [embed] });
        
    } catch (error) {
        console.error('Welcome setup error:', error);
        await interaction.reply({
            embeds: [createErrorEmbed('Failed to setup welcome system.')],
            ephemeral: true
        });
    }
}

async function handleAutoRole(interaction) {
    try {
        const role = interaction.options.getRole('role');
        const action = interaction.options.getString('action');
        
        const guild = await models.Guild.findByPk(interaction.guild.id);
        let autoRoles = guild.autoRoles || [];
        
        if (action === 'add') {
            if (!autoRoles.includes(role.id)) {
                autoRoles.push(role.id);
            }
        } else {
            autoRoles = autoRoles.filter(id => id !== role.id);
        }
        
        await guild.update({ autoRoles });
        
        const embed = createSuccessEmbed(
            `Auto role ${action === 'add' ? 'added' : 'removed'}!\n\n**Role:** ${role.name}\n**Total Auto Roles:** ${autoRoles.length}`,
            'Auto Role Updated'
        );
        
        await interaction.reply({ embeds: [embed] });
        
    } catch (error) {
        console.error('Auto role setup error:', error);
        await interaction.reply({
            embeds: [createErrorEmbed('Failed to setup auto role.')],
            ephemeral: true
        });
    }
}

async function handleSuggestions(interaction) {
    try {
        const channel = interaction.options.getChannel('channel');
        
        const guild = await models.Guild.findByPk(interaction.guild.id);
        await guild.update({
            suggestionChannelId: channel.id
        });
        
        const embed = createSuccessEmbed(
            `Suggestion system configured!\n\n**Channel:** ${channel.name}`,
            'Suggestions Setup Complete'
        );
        
        await interaction.reply({ embeds: [embed] });
        
    } catch (error) {
        console.error('Suggestions setup error:', error);
        await interaction.reply({
            embeds: [createErrorEmbed('Failed to setup suggestion system.')],
            ephemeral: true
        });
    }
}

async function handleModLog(interaction) {
    try {
        const channel = interaction.options.getChannel('channel');
        
        const guild = await models.Guild.findByPk(interaction.guild.id);
        await guild.update({
            modLogChannelId: channel.id
        });
        
        const embed = createSuccessEmbed(
            `Moderation log configured!\n\n**Channel:** ${channel.name}`,
            'Mod Log Setup Complete'
        );
        
        await interaction.reply({ embeds: [embed] });
        
    } catch (error) {
        console.error('Mod log setup error:', error);
        await interaction.reply({
            embeds: [createErrorEmbed('Failed to setup moderation log.')],
            ephemeral: true
        });
    }
}
