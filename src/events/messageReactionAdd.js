const { Events } = require('discord.js');
const { models } = require('../handlers/databaseHandler');

module.exports = {
    name: Events.MessageReactionAdd,
    async execute(reaction, user, client) {
        if (user.bot) return;
        
        try {
            if (reaction.emoji.name === '🎉') {
                const message = reaction.message;
                const giveaway = await models.Giveaway.findOne({
                    where: {
                        messageId: message.id,
                        status: 'active'
                    }
                });
                
                if (giveaway) {
                    const existingEntry = await models.GiveawayEntry.findOne({
                        where: {
                            giveawayId: giveaway.giveawayId,
                            userId: user.id
                        }
                    });
                    
                    if (!existingEntry) {
                        await models.GiveawayEntry.create({
                            giveawayId: giveaway.giveawayId,
                            userId: user.id,
                            guildId: message.guild.id
                        });
                        
                        await giveaway.update({
                            entries: giveaway.entries + 1
                        });
                    }
                }
            }
        } catch (error) {
            console.error('Message reaction add error:', error);
        }
    }
};
