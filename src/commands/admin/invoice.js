const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { createSuccessEmbed, createErrorEmbed, createEmbed } = require('../../utils/embeds');
const { getUser, addCredits, removeCredits, formatCredits } = require('../../utils/helpers');
const { models } = require('../../handlers/databaseHandler');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('invoice')
        .setDescription('Manage invoices and payments')
        .addSubcommand(subcommand =>
            subcommand
                .setName('create')
                .setDescription('Create a new invoice')
                .addUserOption(option =>
                    option.setName('user')
                        .setDescription('User to invoice')
                        .setRequired(true)
                )
                .addNumberOption(option =>
                    option.setName('amount')
                        .setDescription('Invoice amount')
                        .setRequired(true)
                )
                .addStringOption(option =>
                    option.setName('description')
                        .setDescription('Invoice description')
                        .setRequired(true)
                )
                .addStringOption(option =>
                    option.setName('currency')
                        .setDescription('Currency (default: USD)')
                        .setRequired(false)
                )
                .addStringOption(option =>
                    option.setName('duedate')
                        .setDescription('Due date (YYYY-MM-DD)')
                        .setRequired(false)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('pay')
                .setDescription('Pay an invoice')
                .addStringOption(option =>
                    option.setName('invoicenumber')
                        .setDescription('Invoice number to pay')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('list')
                .setDescription('List invoices')
                .addUserOption(option =>
                    option.setName('user')
                        .setDescription('Filter by user (admin only)')
                        .setRequired(false)
                )
                .addStringOption(option =>
                    option.setName('status')
                        .setDescription('Filter by status')
                        .addChoices(
                            { name: 'Pending', value: 'pending' },
                            { name: 'Paid', value: 'paid' },
                            { name: 'Cancelled', value: 'cancelled' }
                        )
                        .setRequired(false)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('cancel')
                .setDescription('Cancel an invoice')
                .addStringOption(option =>
                    option.setName('invoicenumber')
                        .setDescription('Invoice number to cancel')
                        .setRequired(true)
                )
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),
    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();
        
        if (subcommand === 'create') {
            await handleCreate(interaction);
        } else if (subcommand === 'pay') {
            await handlePay(interaction);
        } else if (subcommand === 'list') {
            await handleList(interaction);
        } else if (subcommand === 'cancel') {
            await handleCancel(interaction);
        }
    }
};

async function handleCreate(interaction) {
    try {
        const targetUser = interaction.options.getUser('user');
        const amount = interaction.options.getNumber('amount');
        const description = interaction.options.getString('description');
        const currency = interaction.options.getString('currency') || 'USD';
        const dueDateStr = interaction.options.getString('duedate');
        
        if (amount <= 0) {
            return interaction.reply({
                embeds: [createErrorEmbed('Amount must be greater than 0.')],
                ephemeral: true
            });
        }
        
        let dueDate = null;
        if (dueDateStr) {
            dueDate = new Date(dueDateStr);
            if (isNaN(dueDate.getTime())) {
                return interaction.reply({
                    embeds: [createErrorEmbed('Invalid due date format. Use YYYY-MM-DD.')],
                    ephemeral: true
                });
            }
        }
        
        const invoiceNumber = `INV-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
        
        const invoice = await models.Invoice.create({
            guildId: interaction.guild.id,
            userId: targetUser.id,
            invoiceNumber,
            amount,
            currency,
            description,
            dueDate,
            status: 'pending'
        });
        
        const embed = createEmbed({
            title: '🧾 New Invoice Created',
            description: `Invoice created for **${targetUser.tag}**`,
            color: 0x00AE86,
            fields: [
                {
                    name: 'Invoice Number',
                    value: invoice.invoiceNumber,
                    inline: true
                },
                {
                    name: 'Amount',
                    value: `${currency} ${amount.toFixed(2)}`,
                    inline: true
                },
                {
                    name: 'Due Date',
                    value: dueDate ? dueDate.toLocaleDateString() : 'No due date',
                    inline: true
                },
                {
                    name: 'Description',
                    value: description,
                    inline: false
                },
                {
                    name: 'Status',
                    value: '⏳ Pending',
                    inline: true
                }
            ],
            footer: { text: `Created by ${interaction.user.tag}` },
            timestamp: new Date()
        });
        
        await interaction.reply({ embeds: [embed] });
        
        try {
            const dmEmbed = createEmbed({
                title: '🧾 You have a new invoice',
                description: `You have received a new invoice from **${interaction.guild.name}**`,
                color: 0x00AE86,
                fields: [
                    {
                        name: 'Invoice Number',
                        value: invoice.invoiceNumber,
                        inline: true
                    },
                    {
                        name: 'Amount',
                        value: `${currency} ${amount.toFixed(2)}`,
                        inline: true
                    },
                    {
                        name: 'Description',
                        value: description,
                        inline: false
                    }
                ],
                footer: { text: 'Use /invoice pay to pay this invoice' }
            });
            
            await targetUser.send({ embeds: [dmEmbed] });
        } catch (error) {
            console.error('Error sending invoice DM:', error);
        }
        
    } catch (error) {
        console.error('Create invoice error:', error);
        await interaction.reply({
            embeds: [createErrorEmbed('Failed to create invoice.')],
            ephemeral: true
        });
    }
}

async function handlePay(interaction) {
    try {
        const invoiceNumber = interaction.options.getString('invoicenumber');
        
        const invoice = await models.Invoice.findOne({
            where: {
                invoiceNumber,
                userId: interaction.user.id,
                status: 'pending'
            }
        });
        
        if (!invoice) {
            return interaction.reply({
                embeds: [createErrorEmbed('Invoice not found or already paid.')],
                ephemeral: true
            });
        }
        
        const user = await getUser(interaction.user.id, interaction.guild.id);
        const creditCost = Math.floor(invoice.amount * 100);
        
        if (user.credits < creditCost) {
            return interaction.reply({
                embeds: [createErrorEmbed(`You need ${formatCredits(creditCost)} to pay this invoice. Your balance: ${formatCredits(user.credits)}`)],
                ephemeral: true
            });
        }
        
        await removeCredits(
            interaction.user.id,
            interaction.guild.id,
            creditCost,
            `Invoice payment: ${invoice.invoiceNumber}`
        );
        
        await invoice.update({
            status: 'paid',
            paidAt: new Date(),
            paymentMethod: 'credits'
        });
        
        const embed = createSuccessEmbed(
            `Invoice ${invoice.invoiceNumber} paid successfully!\nAmount: ${invoice.currency} ${invoice.amount.toFixed(2)}\nCredits used: ${formatCredits(creditCost)}`,
            'Invoice Paid'
        );
        
        await interaction.reply({ embeds: [embed] });
        
    } catch (error) {
        console.error('Pay invoice error:', error);
        await interaction.reply({
            embeds: [createErrorEmbed('Failed to pay invoice.')],
            ephemeral: true
        });
    }
}

async function handleList(interaction) {
    try {
        const targetUser = interaction.options.getUser('user');
        const status = interaction.options.getString('status');
        
        let whereClause = { guildId: interaction.guild.id };
        
        if (targetUser && interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
            whereClause.userId = targetUser.id;
        } else if (!targetUser) {
            whereClause.userId = interaction.user.id;
        }
        
        if (status) {
            whereClause.status = status;
        }
        
        const invoices = await models.Invoice.findAll({
            where: whereClause,
            order: [['createdAt', 'DESC']],
            limit: 10
        });
        
        if (invoices.length === 0) {
            return interaction.reply({
                embeds: [createErrorEmbed('No invoices found.')],
                ephemeral: true
            });
        }
        
        const invoiceList = invoices.map(inv => {
            const statusEmoji = inv.status === 'paid' ? '✅' : inv.status === 'cancelled' ? '❌' : '⏳';
            return `${statusEmoji} **${inv.invoiceNumber}** - ${inv.currency} ${inv.amount.toFixed(2)} - ${inv.status}`;
        }).join('\n');
        
        const embed = createEmbed({
            title: '🧾 Invoice List',
            description: invoiceList,
            color: 0x00AE86,
            footer: { text: 'Use /invoice pay to pay pending invoices' }
        });
        
        await interaction.reply({ embeds: [embed] });
        
    } catch (error) {
        console.error('List invoices error:', error);
        await interaction.reply({
            embeds: [createErrorEmbed('Failed to list invoices.')],
            ephemeral: true
        });
    }
}

async function handleCancel(interaction) {
    try {
        const invoiceNumber = interaction.options.getString('invoicenumber');
        
        const invoice = await models.Invoice.findOne({
            where: {
                invoiceNumber,
                guildId: interaction.guild.id,
                status: 'pending'
            }
        });
        
        if (!invoice) {
            return interaction.reply({
                embeds: [createErrorEmbed('Invoice not found or not pending.')],
                ephemeral: true
            });
        }
        
        await invoice.update({
            status: 'cancelled'
        });
        
        const embed = createSuccessEmbed(
            `Invoice ${invoiceNumber} has been cancelled.`,
            'Invoice Cancelled'
        );
        
        await interaction.reply({ embeds: [embed] });
        
    } catch (error) {
        console.error('Cancel invoice error:', error);
        await interaction.reply({
            embeds: [createErrorEmbed('Failed to cancel invoice.')],
            ephemeral: true
        });
    }
}
