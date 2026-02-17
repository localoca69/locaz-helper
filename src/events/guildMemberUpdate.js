const { Events } = require('discord.js');
const { getGuild, getUser, addCredits } = require('../utils/helpers');
const { models } = require('../handlers/databaseHandler');

module.exports = {
    name: Events.GuildMemberUpdate,
    async execute(oldMember, newMember, client) {
        try {
            try {
                const guildRow = await getGuild(newMember.guild.id);
                const tagCfg = guildRow?.settings?.tagHype;

                if (tagCfg && tagCfg.enabled && tagCfg.tag && tagCfg.roleId) {
                    const tag = tagCfg.tag;

                    const oldName = `${oldMember.user.username}${tagCfg.checkNickname ? ` ${oldMember.nickname || ''}` : ''}`;
                    const newName = `${newMember.user.username}${tagCfg.checkNickname ? ` ${newMember.nickname || ''}` : ''}`;

                    const hadTag = oldName.includes(tag);
                    const hasTag = newName.includes(tag);

                    if (!hadTag && hasTag) {
                        const role = await newMember.guild.roles.fetch(tagCfg.roleId).catch(() => null);
                        if (role && !newMember.roles.cache.has(role.id)) {
                            await newMember.roles.add(role).catch(() => null);
                        }

                        const creditsReward = Number(tagCfg.credits || 0);
                        if (creditsReward > 0) {
                            const now = Date.now();
                            const cooldownMs = Number(tagCfg.cooldownMs ?? 24 * 60 * 60 * 1000);

                            const settings = guildRow.settings || {};
                            const tagHype = settings.tagHype || {};
                            const lastRewards = tagHype.lastRewards || {};

                            const last = Number(lastRewards[newMember.id] || 0);
                            if (now - last >= cooldownMs) {
                                await getUser(newMember.id, newMember.guild.id);
                                await addCredits(
                                    newMember.id,
                                    newMember.guild.id,
                                    creditsReward,
                                    `TagHype reward for tag: ${tag}`
                                );

                                lastRewards[newMember.id] = now;
                                tagHype.lastRewards = lastRewards;
                                settings.tagHype = tagHype;
                                await guildRow.update({ settings });
                            }
                        }
                    } else if (hadTag && !hasTag) {
                        const role = await newMember.guild.roles.fetch(tagCfg.roleId).catch(() => null);
                        if (role && newMember.roles.cache.has(role.id)) {
                            await newMember.roles.remove(role).catch(() => null);
                        }
                    }
                }
            } catch (error) {
                console.error('TagHype handling error:', error);
            }

            if (oldMember.premiumSince === null && newMember.premiumSince !== null) {
                const guild = await getGuild(newMember.guild.id);
                const user = await getUser(newMember.id, newMember.guild.id);
                
                await user.update({
                    boostCount: user.boostCount + 1
                });
                
                const rewardAmount = guild.boostRewardAmount || 500;
                await addCredits(
                    newMember.id,
                    newMember.guild.id,
                    rewardAmount,
                    'Server boost reward'
                );
                
                if (guild.boostRewardChannelId) {
                    try {
                        const channel = await newMember.guild.channels.fetch(guild.boostRewardChannelId);
                        if (channel) {
                            await channel.send({
                                content: `🎉 ${newMember.toString()} just boosted the server! They received ${rewardAmount} credits as a reward!`
                            });
                        }
                    } catch (error) {
                        console.error('Error sending boost reward message:', error);
                    }
                }
            }
        } catch (error) {
            console.error('Guild member update error:', error);
        }
    }
};
