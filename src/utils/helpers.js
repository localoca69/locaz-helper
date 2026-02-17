const { models } = require('../handlers/databaseHandler');

async function getUser(userId, guildId) {
    let user = await models.User.findByPk(userId);
    if (!user) {
        user = await models.User.create({
            userId,
            username: 'Unknown',
            discriminator: '0000',
            credits: parseInt(process.env.STARTING_CREDITS) || 100
        });
    }
    return user;
}

async function getGuild(guildId) {
    let guild = await models.Guild.findByPk(guildId);
    if (!guild) {
        guild = await models.Guild.create({
            guildId,
            name: 'Unknown Server',
            ownerId: '0'
        });
    }
    return guild;
}

async function addCredits(userId, guildId, amount, description, type = 'credit') {
    const user = await getUser(userId);
    const newBalance = user.credits + amount;
    
    await user.update({ credits: newBalance });
    
    await models.Transaction.create({
        userId,
        guildId,
        type,
        amount,
        balance: newBalance,
        description
    });
    
    return newBalance;
}

async function removeCredits(userId, guildId, amount, description, type = 'debit') {
    const user = await getUser(userId);
    if (user.credits < amount) throw new Error('Insufficient credits');
    
    const newBalance = user.credits - amount;
    await user.update({ credits: newBalance });
    
    await models.Transaction.create({
        userId,
        guildId,
        type,
        amount: -amount,
        balance: newBalance,
        description
    });
    
    return newBalance;
}

function formatCredits(amount) {
    return `${amount.toLocaleString()} 💰`;
}

function formatTime(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days}d ${hours % 24}h ${minutes % 60}m`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
}

function generateId() {
    return Math.random().toString(36).substring(2, 15);
}

module.exports = {
    getUser,
    getGuild,
    addCredits,
    removeCredits,
    formatCredits,
    formatTime,
    generateId
};
