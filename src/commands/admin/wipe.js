const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { createSuccessEmbed, createErrorEmbed, createWarningEmbed } = require('../../utils/embeds');
const { models } = require('../../handlers/databaseHandler');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('wipe')
        .setDescription('Data management and wipe operations')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addSubcommand(subcommand =>
            subcommand
                .setName('credits')
                .setDescription('Wipe all user credits')
                .addBooleanOption(option =>
                    option.setName('confirm')
                        .setDescription('Confirm the wipe operation')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('tickets')
                .setDescription('Wipe all ticket data')
                .addBooleanOption(option =>
                    option.setName('confirm')
                        .setDescription('Confirm the wipe operation')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('giveaways')
                .setDescription('Wipe all giveaway data')
                .addBooleanOption(option =>
                    option.setName('confirm')
                        .setDescription('Confirm the wipe operation')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('transactions')
                .setDescription('Wipe transaction history')
                .addBooleanOption(option =>
                    option.setName('confirm')
                        .setDescription('Confirm the wipe operation')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('user')
                .setDescription('Wipe specific user data')
                .addUserOption(option =>
                    option.setName('target')
                        .setDescription('User to wipe data for')
                        .setRequired(true)
                )
                .addStringOption(option =>
                    option.setName('type')
                        .setDescription('Type of data to wipe')
                        .addChoices(
                            { name: 'All Data', value: 'all' },
                            { name: 'Credits Only', value: 'credits' },
                            { name: 'Tickets Only', value: 'tickets' },
                            { name: 'Transactions Only', value: 'transactions' }
                        )
                        .setRequired(true)
                )
                .addBooleanOption(option =>
                    option.setName('confirm')
                        .setDescription('Confirm the wipe operation')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('backup')
                .setDescription('Create a data backup before wiping')
                .addStringOption(option =>
                    option.setName('type')
                        .setDescription('Type of data to backup')
                        .addChoices(
                            { name: 'All Data', value: 'all' },
                            { name: 'Users', value: 'users' },
                            { name: 'Transactions', value: 'transactions' },
                            { name: 'Tickets', value: 'tickets' }
                        )
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('stats')
                .setDescription('Show database statistics')
        ),
    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();
        
        if (subcommand === 'credits') {
            await handleCreditsWipe(interaction);
        } else if (subcommand === 'tickets') {
            await handleTicketsWipe(interaction);
        } else if (subcommand === 'giveaways') {
            await handleGiveawaysWipe(interaction);
        } else if (subcommand === 'transactions') {
            await handleTransactionsWipe(interaction);
        } else if (subcommand === 'user') {
            await handleUserWipe(interaction);
        } else if (subcommand === 'backup') {
            await handleBackup(interaction);
        } else if (subcommand === 'stats') {
            await handleStats(interaction);
        }
    }
};

async function handleCreditsWipe(interaction) {
    try {
        const confirm = interaction.options.getBoolean('confirm');
        
        if (!confirm) {
            return interaction.reply({
                embeds: [createErrorEmbed('You must confirm the wipe operation.')],
                ephemeral: true
            });
        }
        
        const warningEmbed = createWarningEmbed(
            '⚠️ **WARNING**: This will reset ALL user credits to the default amount. This action cannot be undone!\n\nType `confirm` in the chat to proceed.',
            'Credits Wipe Warning'
        );
        
        await interaction.reply({ embeds: [warningEmbed] });
        
        const filter = m => m.author.id === interaction.user.id && m.content.toLowerCase() === 'confirm';
        const collector = interaction.channel.createMessageCollector({ filter, max: 1, time: 30000 });
        
        collector.on('collect', async () => {
            try {
                const defaultCredits = parseInt(process.env.STARTING_CREDITS) || 100;
                await models.User.update(
                    { credits: defaultCredits },
                    { where: {} }
                );
                
                const successEmbed = createSuccessEmbed(
                    `All user credits have been reset to ${defaultCredits}.`,
                    'Credits Wipe Complete'
                );
                
                await interaction.followUp({ embeds: [successEmbed] });
                
            } catch (error) {
                console.error('Credits wipe error:', error);
                await interaction.followUp({
                    embeds: [createErrorEmbed('Failed to wipe credits.')],
                    ephemeral: true
                });
            }
        });
        
        collector.on('end', (collected) => {
            if (collected.size === 0) {
                interaction.followUp({
                    embeds: [createErrorEmbed('Wipe operation cancelled.')],
                    ephemeral: true
                });
            }
        });
        
    } catch (error) {
        console.error('Credits wipe error:', error);
        await interaction.reply({
            embeds: [createErrorEmbed('Failed to initiate credits wipe.')],
            ephemeral: true
        });
    }
}

async function handleTicketsWipe(interaction) {
    try {
        const confirm = interaction.options.getBoolean('confirm');
        
        if (!confirm) {
            return interaction.reply({
                embeds: [createErrorEmbed('You must confirm the wipe operation.')],
                ephemeral: true
            });
        }
        
        await models.Ticket.destroy({
            where: { guildId: interaction.guild.id }
        });
        
        const embed = createSuccessEmbed(
            'All ticket data for this server has been wiped.',
            'Tickets Wipe Complete'
        );
        
        await interaction.reply({ embeds: [embed] });
        
    } catch (error) {
        console.error('Tickets wipe error:', error);
        await interaction.reply({
            embeds: [createErrorEmbed('Failed to wipe tickets.')],
            ephemeral: true
        });
    }
}

async function handleGiveawaysWipe(interaction) {
    try {
        const confirm = interaction.options.getBoolean('confirm');
        
        if (!confirm) {
            return interaction.reply({
                embeds: [createErrorEmbed('You must confirm the wipe operation.')],
                ephemeral: true
            });
        }
        
        await models.Giveaway.destroy({
            where: { guildId: interaction.guild.id }
        });
        
        await models.GiveawayEntry.destroy({
            where: { guildId: interaction.guild.id }
        });
        
        const embed = createSuccessEmbed(
            'All giveaway data for this server has been wiped.',
            'Giveaways Wipe Complete'
        );
        
        await interaction.reply({ embeds: [embed] });
        
    } catch (error) {
        console.error('Giveaways wipe error:', error);
        await interaction.reply({
            embeds: [createErrorEmbed('Failed to wipe giveaways.')],
            ephemeral: true
        });
    }
}

async function handleTransactionsWipe(interaction) {
    try {
        const confirm = interaction.options.getBoolean('confirm');
        
        if (!confirm) {
            return interaction.reply({
                embeds: [createErrorEmbed('You must confirm the wipe operation.')],
                ephemeral: true
            });
        }
        
        await models.Transaction.destroy({
            where: { guildId: interaction.guild.id }
        });
        
        const embed = createSuccessEmbed(
            'All transaction history for this server has been wiped.',
            'Transactions Wipe Complete'
        );
        
        await interaction.reply({ embeds: [embed] });
        
    } catch (error) {
        console.error('Transactions wipe error:', error);
        await interaction.reply({
            embeds: [createErrorEmbed('Failed to wipe transactions.')],
            ephemeral: true
        });
    }
}

async function handleUserWipe(interaction) {
    try {
        const targetUser = interaction.options.getUser('target');
        const type = interaction.options.getString('type');
        const confirm = interaction.options.getBoolean('confirm');
        
        if (!confirm) {
            return interaction.reply({
                embeds: [createErrorEmbed('You must confirm the wipe operation.')],
                ephemeral: true
            });
        }
        
        switch (type) {
            case 'all':
                await models.User.destroy({ where: { userId: targetUser.id } });
                await models.Transaction.destroy({ where: { userId: targetUser.id } });
                await models.Ticket.destroy({ where: { userId: targetUser.id } });
                await models.GiveawayEntry.destroy({ where: { userId: targetUser.id } });
                await models.Suggestion.destroy({ where: { userId: targetUser.id } });
                await models.Invoice.destroy({ where: { userId: targetUser.id } });
                break;
            
            case 'credits':
                await models.User.update(
                    { credits: parseInt(process.env.STARTING_CREDITS) || 100 },
                    { where: { userId: targetUser.id } }
                );
                break;
            
            case 'tickets':
                await models.Ticket.destroy({ where: { userId: targetUser.id } });
                break;
            
            case 'transactions':
                await models.Transaction.destroy({ where: { userId: targetUser.id } });
                break;
        }
        
        const embed = createSuccessEmbed(
            `${targetUser.tag}'s ${type} data has been wiped.`,
            'User Data Wipe Complete'
        );
        
        await interaction.reply({ embeds: [embed] });
        
    } catch (error) {
        console.error('User wipe error:', error);
        await interaction.reply({
            embeds: [createErrorEmbed('Failed to wipe user data.')],
            ephemeral: true
        });
    }
}

async function handleBackup(interaction) {
    try {
        const type = interaction.options.getString('type');
        
        let backupData = {};
        
        switch (type) {
            case 'all':
                backupData.users = await models.User.findAll();
                backupData.transactions = await models.Transaction.findAll();
                backupData.tickets = await models.Ticket.findAll();
                backupData.giveaways = await models.Giveaway.findAll();
                break;
            
            case 'users':
                backupData.users = await models.User.findAll();
                break;
            
            case 'transactions':
                backupData.transactions = await models.Transaction.findAll();
                break;
            
            case 'tickets':
                backupData.tickets = await models.Ticket.findAll();
                break;
        }
        
        const fs = require('fs');
        const path = require('path');
        const backupDir = path.join(__dirname, '../../backups');
        
        if (!fs.existsSync(backupDir)) {
            fs.mkdirSync(backupDir);
        }
        
        const filename = `backup-${type}-${Date.now()}.json`;
        const filepath = path.join(backupDir, filename);
        
        fs.writeFileSync(filepath, JSON.stringify(backupData, null, 2));
        
        const embed = createSuccessEmbed(
            `Backup created: ${filename}\n\n**Data Type:** ${type}\n**Records:** ${Object.keys(backupData).reduce((sum, key) => sum + backupData[key].length, 0)}`,
            'Backup Created'
        );
        
        await interaction.reply({ embeds: [embed] });
        
    } catch (error) {
        console.error('Backup error:', error);
        await interaction.reply({
            embeds: [createErrorEmbed('Failed to create backup.')],
            ephemeral: true
        });
    }
}

async function handleStats(interaction) {
    try {
        const userCount = await models.User.count();
        const transactionCount = await models.Transaction.count();
        const ticketCount = await models.Ticket.count();
        const giveawayCount = await models.Giveaway.count();
        const suggestionCount = await models.Suggestion.count();
        const invoiceCount = await models.Invoice.count();
        
        const totalCredits = await models.User.sum('credits') || 0;
        
        const embed = createEmbed({
            title: '📊 Database Statistics',
            description: 'Current database statistics for this server:',
            color: 0x00AE86,
            fields: [
                {
                    name: '👥 Users',
                    value: userCount.toString(),
                    inline: true
                },
                {
                    name: '💰 Total Credits',
                    value: totalCredits.toLocaleString(),
                    inline: true
                },
                {
                    name: '📝 Transactions',
                    value: transactionCount.toString(),
                    inline: true
                },
                {
                    name: '🎫 Tickets',
                    value: ticketCount.toString(),
                    inline: true
                },
                {
                    name: '🎉 Giveaways',
                    value: giveawayCount.toString(),
                    inline: true
                },
                {
                    name: '💡 Suggestions',
                    value: suggestionCount.toString(),
                    inline: true
                },
                {
                    name: '🧾 Invoices',
                    value: invoiceCount.toString(),
                    inline: true
                }
            ],
            footer: { text: `Server: ${interaction.guild.name}` },
            timestamp: new Date()
        });
        
        await interaction.reply({ embeds: [embed] });
        
    } catch (error) {
        console.error('Stats error:', error);
        await interaction.reply({
            embeds: [createErrorEmbed('Failed to fetch statistics.')],
            ephemeral: true
        });
    }
}
