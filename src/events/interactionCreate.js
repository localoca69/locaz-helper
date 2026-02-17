const { Events } = require('discord.js');
const { createEmbed } = require('../utils/embeds');

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction, client) {
        if (interaction.isStringSelectMenu()) {
            if (!interaction.customId.startsWith('roleselect:')) return;

            try {
                const { models } = require('../handlers/databaseHandler');
                const guildRow = await models.Guild.findByPk(interaction.guild.id);
                const settings = guildRow?.settings || {};
                const roleSelectMenus = settings.roleSelectMenus || {};

                const config = roleSelectMenus[interaction.message.id];
                if (!config) {
                    return interaction.reply({ content: 'This role selector is no longer active.', ephemeral: true });
                }

                const member = await interaction.guild.members.fetch(interaction.user.id);
                const selectedRoleIds = interaction.values;
                const allRoleIds = config.roleIds || [];

                const rolesToAdd = selectedRoleIds.filter(rid => !member.roles.cache.has(rid));
                const rolesToRemove = (config.removeOnDeselect ? allRoleIds : [])
                    .filter(rid => !selectedRoleIds.includes(rid) && member.roles.cache.has(rid));

                if (rolesToAdd.length > 0) {
                    await member.roles.add(rolesToAdd).catch(() => null);
                }
                if (rolesToRemove.length > 0) {
                    await member.roles.remove(rolesToRemove).catch(() => null);
                }

                return interaction.reply({ content: 'Your roles have been updated.', ephemeral: true });
            } catch (error) {
                console.error('Role select menu error:', error);
                return interaction.reply({ content: 'Failed to update roles.', ephemeral: true });
            }
        }

        if (!interaction.isChatInputCommand()) return;
        
        const command = client.slashCommands.get(interaction.commandName);
        
        if (!command) {
            console.error(`No command matching ${interaction.commandName} was found.`);
            return;
        }
        
        const { cooldowns } = client;
        
        if (!cooldowns.has(command.data.name)) {
            cooldowns.set(command.data.name, new Map());
        }
        
        const now = Date.now();
        const timestamps = cooldowns.get(command.data.name);
        const defaultCooldownDuration = 3;
        const cooldownAmount = (command.cooldown ?? defaultCooldownDuration) * 1000;
        
        if (timestamps.has(interaction.user.id)) {
            const expirationTime = timestamps.get(interaction.user.id) + cooldownAmount;
            
            if (now < expirationTime) {
                const expiredTimestamp = Math.round(expirationTime / 1000);
                return interaction.reply({
                    embeds: [createEmbed({
                        title: 'Cooldown',
                        description: `Please wait, you are on a cooldown for \`${command.data.name}\`. You can use it again <t:${expiredTimestamp}:R>.`,
                        color: 0xFF0000
                    })],
                    ephemeral: true
                });
            }
        }
        
        timestamps.set(interaction.user.id, now);
        setTimeout(() => timestamps.delete(interaction.user.id), cooldownAmount);
        
        try {
            await command.execute(interaction);
        } catch (error) {
            console.error(`Error executing ${interaction.commandName}:`, error);
            
            const errorMessage = {
                content: 'There was an error while executing this command!',
                ephemeral: true
            };
            
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp(errorMessage);
            } else {
                await interaction.reply(errorMessage);
            }
        }
    }
};
