const fs = require('fs');
const path = require('path');
const { REST, Routes } = require('discord.js');

async function loadSlashCommands(client, commandsPath) {
    const commands = [];
    const commandFolders = fs.readdirSync(commandsPath);
    
    for (const folder of commandFolders) {
        const folderPath = path.join(commandsPath, folder);
        const stat = fs.statSync(folderPath);
        
        if (stat.isDirectory()) {
            const commandFiles = fs.readdirSync(folderPath).filter(file => file.endsWith('.js'));
            
            for (const file of commandFiles) {
                const filePath = path.join(folderPath, file);
                const command = require(filePath);
                
                if ('data' in command && 'execute' in command) {
                    commands.push(command.data.toJSON());
                    client.slashCommands.set(command.data.name, command);
                }
            }
        }
    }
    
    const rest = new REST({ version: '10' }).setToken(process.env.BOT_TOKEN);
    
    try {
        console.log(`🔄 Started refreshing ${commands.length} application (/) commands.`);
        
        const data = await rest.put(
            Routes.applicationCommands(client.user.id),
            { body: commands },
        );
        
        console.log(`✅ Successfully reloaded ${data.length} application (/) commands.`);
    } catch (error) {
        console.error('❌ Error deploying slash commands:', error);
    }
}

module.exports = { loadSlashCommands };
