const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { createSuccessEmbed, createErrorEmbed, createEmbed } = require('../../utils/embeds');
const { models } = require('../../handlers/databaseHandler');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('taghype')
        .setDescription('Auto role + credits when a member adds a tag to their name')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addSubcommand(subcommand =>
            subcommand
                .setName('setup')
                .setDescription('Configure TagHype')
                .addStringOption(option =>
                    option.setName('tag')
                        .setDescription('Tag to detect in username/nickname (case-sensitive)')
                        .setRequired(true)
                )
                .addRoleOption(option =>
                    option.setName('role')
                        .setDescription('Role to give when tag is present')
                        .setRequired(true)
                )
                .addIntegerOption(option =>
                    option.setName('credits')
                        .setDescription('Credits to reward when tag is added (0 to disable)')
                        .setMinValue(0)
                        .setRequired(false)
                )
                .addIntegerOption(option =>
                    option.setName('cooldown_hours')
                        .setDescription('How often a member can be rewarded again (default 24h)')
                        .setMinValue(0)
                        .setMaxValue(168)
                        .setRequired(false)
                )
                .addBooleanOption(option =>
                    option.setName('check_nickname')
                        .setDescription('Also check nicknames (recommended)')
                        .setRequired(false)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('disable')
                .setDescription('Disable TagHype')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('status')
                .setDescription('View TagHype status')
        ),
    async execute(interaction) {
        const sub = interaction.options.getSubcommand();
        if (sub === 'setup') return handleSetup(interaction);
        if (sub === 'disable') return handleDisable(interaction);
        if (sub === 'status') return handleStatus(interaction);
    }
};

async function handleSetup(interaction) {
    try {
        const tag = interaction.options.getString('tag');
        const role = interaction.options.getRole('role');
        const credits = interaction.options.getInteger('credits') ?? 0;
        const cooldownHours = interaction.options.getInteger('cooldown_hours') ?? 24;
        const checkNickname = interaction.options.getBoolean('check_nickname') ?? true;

        const guildRow = await models.Guild.findByPk(interaction.guild.id);
        if (!guildRow) {
            return interaction.reply({ embeds: [createErrorEmbed('Guild config not found in database.')], ephemeral: true });
        }

        const settings = guildRow.settings || {};
        settings.tagHype = {
            enabled: true,
            tag,
            roleId: role.id,
            credits,
            cooldownMs: cooldownHours * 60 * 60 * 1000,
            checkNickname
        };

        await guildRow.update({ settings });

        return interaction.reply({
            embeds: [createSuccessEmbed(
                `TagHype enabled.\n\n**Tag:** ${tag}\n**Role:** ${role.name}\n**Credits Reward:** ${credits}\n**Cooldown:** ${cooldownHours}h\n**Check Nickname:** ${checkNickname ? 'Yes' : 'No'}`,
                'TagHype Setup Complete'
            )]
        });
    } catch (error) {
        console.error('TagHype setup error:', error);
        return interaction.reply({ embeds: [createErrorEmbed('Failed to setup TagHype.')], ephemeral: true });
    }
}

async function handleDisable(interaction) {
    try {
        const guildRow = await models.Guild.findByPk(interaction.guild.id);
        if (!guildRow) {
            return interaction.reply({ embeds: [createErrorEmbed('Guild config not found in database.')], ephemeral: true });
        }

        const settings = guildRow.settings || {};
        settings.tagHype = { enabled: false };
        await guildRow.update({ settings });

        return interaction.reply({ embeds: [createSuccessEmbed('TagHype disabled.', 'TagHype Disabled')] });
    } catch (error) {
        console.error('TagHype disable error:', error);
        return interaction.reply({ embeds: [createErrorEmbed('Failed to disable TagHype.')], ephemeral: true });
    }
}

async function handleStatus(interaction) {
    try {
        const guildRow = await models.Guild.findByPk(interaction.guild.id);
        const cfg = guildRow?.settings?.tagHype;

        if (!cfg || !cfg.enabled) {
            return interaction.reply({ embeds: [createEmbed({ title: 'TagHype Status', description: 'Disabled', color: 0xFF0000 })], ephemeral: true });
        }

        const embed = createEmbed({
            title: 'TagHype Status',
            description: 'Enabled',
            color: 0x00AE86,
            fields: [
                { name: 'Tag', value: cfg.tag || 'N/A', inline: true },
                { name: 'Role ID', value: cfg.roleId || 'N/A', inline: true },
                { name: 'Credits', value: String(cfg.credits ?? 0), inline: true },
                { name: 'Cooldown', value: `${Math.floor((cfg.cooldownMs ?? 0) / (60 * 60 * 1000))}h`, inline: true },
                { name: 'Check Nickname', value: cfg.checkNickname ? 'Yes' : 'No', inline: true }
            ]
        });

        return interaction.reply({ embeds: [embed], ephemeral: true });
    } catch (error) {
        console.error('TagHype status error:', error);
        return interaction.reply({ embeds: [createErrorEmbed('Failed to fetch TagHype status.')], ephemeral: true });
    }
}
