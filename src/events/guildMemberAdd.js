const { Events } = require('discord.js');
const { getUser, getGuild, addCredits } = require('../utils/helpers');
const { models } = require('../handlers/databaseHandler');

module.exports = {
    name: Events.GuildMemberAdd,
    async execute(member, client) {
        try {
            const guild = await getGuild(member.guild.id);
            const user = await getUser(member.id, member.guild.id);
            
            await user.update({
                username: member.user.username,
                discriminator: member.user.discriminator,
                avatar: member.user.displayAvatarURL()
            });
            
            if (guild.welcomeEnabled && guild.welcomeChannelId) {
                try {
                    const welcomeChannel = await member.guild.channels.fetch(guild.welcomeChannelId);
                    if (welcomeChannel) {
                        const welcomeMessage = guild.welcomeMessage
                            .replace('{user}', member.toString())
                            .replace('{server}', member.guild.name)
                            .replace('{count}', member.guild.memberCount.toString());
                        
                        await welcomeChannel.send(welcomeMessage);
                    }
                } catch (error) {
                    console.error('Error sending welcome message:', error);
                }
            }
            
            if (guild.autoRoles && guild.autoRoles.length > 0) {
                try {
                    for (const roleId of guild.autoRoles) {
                        const role = await member.guild.roles.fetch(roleId).catch(() => null);
                        if (role) {
                            await member.roles.add(role);
                        }
                    }
                } catch (error) {
                    console.error('Error assigning auto roles:', error);
                }
            }
            
            const startingCredits = guild.startingCredits || parseInt(process.env.STARTING_CREDITS) || 100;
            if (user.credits < startingCredits) {
                await addCredits(
                    member.id,
                    member.guild.id,
                    startingCredits - user.credits,
                    'Welcome bonus'
                );
            }
            
        } catch (error) {
            console.error('Guild member add error:', error);
        }
    }
};
