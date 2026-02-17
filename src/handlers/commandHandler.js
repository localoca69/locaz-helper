const fs = require('fs');
const path = require('path');

async function loadCommands(client, commandsPath) {
    client.commands.clear();
    
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
                    client.commands.set(command.data.name, command);
                    console.log(`📝 Loaded command: ${command.data.name}`);
                } else {
                    console.log(`⚠️ The command at ${filePath} is missing a required "data" or "execute" property.`);
                }
            }
        } else if (folder.endsWith('.js')) {
            const command = require(path.join(commandsPath, folder));
            
            if ('data' in command && 'execute' in command) {
                client.commands.set(command.data.name, command);
                console.log(`📝 Loaded command: ${command.data.name}`);
            } else {
                console.log(`⚠️ The command at ${path.join(commandsPath, folder)} is missing a required "data" or "execute" property.`);
            }
        }
    }
}

module.exports = { loadCommands };
