const {
    SlashCommandBuilder,
    PermissionFlagsBits,
    ActionRowBuilder,
    StringSelectMenuBuilder
} = require('discord.js');
const { createSuccessEmbed, createErrorEmbed, createEmbed } = require('../../utils/embeds');
const { models } = require('../../handlers/databaseHandler');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('roleselect')
        .setDescription('Create role dropdown selectors')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
        .addSubcommand(subcommand =>
            subcommand
                .setName('create')
                .setDescription('Create a role select dropdown')
                .addStringOption(option =>
                    option.setName('title')
                        .setDescription('Embed title')
                        .setRequired(true)
                )
                .addStringOption(option =>
                    option.setName('description')
                        .setDescription('Embed description')
                        .setRequired(true)
                )
                .addBooleanOption(option =>
                    option.setName('remove_on_deselect')
                        .setDescription('Remove roles when user unselects them')
                        .setRequired(false)
                )
                .addRoleOption(option =>
                    option.setName('role1')
                        .setDescription('Role option 1')
                        .setRequired(true)
                )
                .addStringOption(option =>
                    option.setName('label1')
                        .setDescription('Label for role 1')
                        .setRequired(false)
                )
                .addRoleOption(option =>
                    option.setName('role2')
                        .setDescription('Role option 2')
                        .setRequired(false)
                )
                .addStringOption(option =>
                    option.setName('label2')
                        .setDescription('Label for role 2')
                        .setRequired(false)
                )
                .addRoleOption(option =>
                    option.setName('role3')
                        .setDescription('Role option 3')
                        .setRequired(false)
                )
                .addStringOption(option =>
                    option.setName('label3')
                        .setDescription('Label for role 3')
                        .setRequired(false)
                )
                .addRoleOption(option =>
                    option.setName('role4')
                        .setDescription('Role option 4')
                        .setRequired(false)
                )
                .addStringOption(option =>
                    option.setName('label4')
                        .setDescription('Label for role 4')
                        .setRequired(false)
                )
                .addRoleOption(option =>
                    option.setName('role5')
                        .setDescription('Role option 5')
                        .setRequired(false)
                )
                .addStringOption(option =>
                    option.setName('label5')
                        .setDescription('Label for role 5')
                        .setRequired(false)
                )
                .addIntegerOption(option =>
                    option.setName('min')
                        .setDescription('Minimum selections')
                        .setMinValue(0)
                        .setMaxValue(5)
                        .setRequired(false)
                )
                .addIntegerOption(option =>
                    option.setName('max')
                        .setDescription('Maximum selections')
                        .setMinValue(1)
                        .setMaxValue(5)
                        .setRequired(false)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('disable')
                .setDescription('Disable a role select dropdown by message id')
                .addStringOption(option =>
                    option.setName('message_id')
                        .setDescription('Message ID where the dropdown exists')
                        .setRequired(true)
                )
        ),
    async execute(interaction) {
        const sub = interaction.options.getSubcommand();
        if (sub === 'create') return handleCreate(interaction);
        if (sub === 'disable') return handleDisable(interaction);
    }
};

async function handleCreate(interaction) {
    try {
        const title = interaction.options.getString('title');
        const description = interaction.options.getString('description');
        const removeOnDeselect = interaction.options.getBoolean('remove_on_deselect') ?? true;
        const min = interaction.options.getInteger('min') ?? 0;
        const max = interaction.options.getInteger('max') ?? 1;

        const roles = [];
        for (let i = 1; i <= 5; i++) {
            const role = interaction.options.getRole(`role${i}`);
            if (!role) continue;
            const label = interaction.options.getString(`label${i}`) || role.name;
            roles.push({ role, label });
        }

        if (roles.length === 0) {
            return interaction.reply({ embeds: [createErrorEmbed('You must provide at least one role.')], ephemeral: true });
        }

        if (max > roles.length) {
            return interaction.reply({
                embeds: [createErrorEmbed(`Max selections cannot exceed number of roles (${roles.length}).`)],
                ephemeral: true
            });
        }

        const menu = new StringSelectMenuBuilder()
            .setCustomId(`roleselect:${interaction.guild.id}`)
            .setPlaceholder('Select your roles')
            .setMinValues(min)
            .setMaxValues(max)
            .addOptions(
                roles.map(({ role, label }) => ({
                    label,
                    value: role.id
                }))
            );

        const row = new ActionRowBuilder().addComponents(menu);

        const embed = createEmbed({
            title,
            description,
            color: 0x00AE86
        });

        const msg = await interaction.channel.send({ embeds: [embed], components: [row] });

        const guildRow = await models.Guild.findByPk(interaction.guild.id);
        if (!guildRow) {
            return interaction.reply({ embeds: [createErrorEmbed('Guild config not found in database.')], ephemeral: true });
        }

        const settings = guildRow.settings || {};
        const roleSelectMenus = settings.roleSelectMenus || {};

        roleSelectMenus[msg.id] = {
            channelId: interaction.channel.id,
            roleIds: roles.map(r => r.role.id),
            removeOnDeselect
        };

        settings.roleSelectMenus = roleSelectMenus;
        await guildRow.update({ settings });

        return interaction.reply({
            embeds: [createSuccessEmbed(`Role selector created. Message ID: ${msg.id}`, 'Role Selector Created')],
            ephemeral: true
        });
    } catch (error) {
        console.error('Role select create error:', error);
        return interaction.reply({ embeds: [createErrorEmbed('Failed to create role selector.')], ephemeral: true });
    }
}

async function handleDisable(interaction) {
    try {
        const messageId = interaction.options.getString('message_id');
        const guildRow = await models.Guild.findByPk(interaction.guild.id);
        if (!guildRow) {
            return interaction.reply({ embeds: [createErrorEmbed('Guild config not found in database.')], ephemeral: true });
        }

        const settings = guildRow.settings || {};
        const roleSelectMenus = settings.roleSelectMenus || {};

        if (!roleSelectMenus[messageId]) {
            return interaction.reply({ embeds: [createErrorEmbed('No role selector found with that message id.')], ephemeral: true });
        }

        delete roleSelectMenus[messageId];
        settings.roleSelectMenus = roleSelectMenus;
        await guildRow.update({ settings });

        return interaction.reply({ embeds: [createSuccessEmbed('Role selector disabled.', 'Role Selector Disabled')], ephemeral: true });
    } catch (error) {
        console.error('Role select disable error:', error);
        return interaction.reply({ embeds: [createErrorEmbed('Failed to disable role selector.')], ephemeral: true });
    }
}
