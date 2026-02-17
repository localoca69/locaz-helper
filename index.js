const { Client, GatewayIntentBits, Collection, Events, ActivityType } = require('discord.js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildBans,
        GatewayIntentBits.GuildEmojisAndStickers,
        GatewayIntentBits.GuildIntegrations,
        GatewayIntentBits.GuildWebhooks,
        GatewayIntentBits.GuildInvites,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildPresences,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.GuildMessageTyping,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.DirectMessageReactions,
        GatewayIntentBits.DirectMessageTyping,
        GatewayIntentBits.MessageContent
    ]
});

client.commands = new Collection();
client.cooldowns = new Collection();
client.slashCommands = new Collection();

const handlersPath = path.join(__dirname, 'src/handlers');
const commandFolders = fs.readdirSync(path.join(__dirname, 'src/commands'));
const eventFiles = fs.readdirSync(path.join(__dirname, 'src/events')).filter(file => file.endsWith('.js'));

const { loadCommands } = require(path.join(handlersPath, 'commandHandler'));
const { loadEvents } = require(path.join(handlersPath, 'eventHandler'));
const { loadSlashCommands } = require(path.join(handlersPath, 'slashCommandHandler'));
const { connectDatabase } = require(path.join(handlersPath, 'databaseHandler'));

async function initializeBot() {
    try {
        console.log('🔄 Initializing Discord Helper Bot...');
        
        await connectDatabase();
        console.log('✅ Database connected successfully');
        
        await loadCommands(client, path.join(__dirname, 'src/commands'));
        console.log('✅ Commands loaded successfully');
        
        await loadEvents(client, path.join(__dirname, 'src/events'));
        console.log('✅ Events loaded successfully');
        
        await loadSlashCommands(client, path.join(__dirname, 'src/commands'));
        console.log('✅ Slash commands loaded successfully');
        
        client.login(process.env.BOT_TOKEN);
        
    } catch (error) {
        console.error('❌ Error initializing bot:', error);
        process.exit(1);
    }
}

client.once(Events.ClientReady, () => {
    console.log(`✅ Logged in as ${client.user.tag}!`);
    console.log(`🤖 Bot is ready and serving ${client.guilds.cache.size} servers`);
    
    client.user.setActivity('Discord Helper Bot', { type: ActivityType.Watching });
    
    const activities = [
        { name: 'Managing tickets 🎫', type: ActivityType.Watching },
        { name: 'Hosting giveaways 🎉', type: ActivityType.Playing },
        { name: 'Counting credits 💰', type: ActivityType.Watching },
        { name: 'Moderating servers 🔨', type: ActivityType.Playing },
        { name: 'Helping users 🤝', type: ActivityType.Playing }
    ];
    
    let activityIndex = 0;
    setInterval(() => {
        const activity = activities[activityIndex];
        client.user.setActivity(activity.name, { type: activity.type });
        activityIndex = (activityIndex + 1) % activities.length;
    }, 30000);
});

client.on(Events.Error, error => {
    console.error('❌ Discord API Error:', error);
});

client.on(Events.Warn, warning => {
    console.warn('⚠️ Discord API Warning:', warning);
});

process.on('unhandledRejection', error => {
    console.error('❌ Unhandled Promise Rejection:', error);
});

process.on('uncaughtException', error => {
    console.error('❌ Uncaught Exception:', error);
    process.exit(1);
});

initializeBot();

module.exports = client;
