const { SlashCommandBuilder } = require('discord.js');
const { createSuccessEmbed, createErrorEmbed, createEmbed } = require('../../utils/embeds');
const { getUser, addCredits, formatCredits } = require('../../utils/helpers');
const { models } = require('../../handlers/databaseHandler');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('event')
        .setDescription('Participate in server events')
        .addSubcommand(subcommand =>
            subcommand
                .setName('dino')
                .setDescription('Play the dinosaur jumping game')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('number')
                .setDescription('Guess the number game')
                .addIntegerOption(option =>
                    option.setName('guess')
                        .setDescription('Your guess (1-100)')
                        .setMinValue(1)
                        .setMaxValue(100)
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('vault')
                .setDescription('Try to crack the vault code')
                .addStringOption(option =>
                    option.setName('code')
                        .setDescription('4-digit vault code')
                        .setLength(4)
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('chat')
                .setDescription('Chat event - type words to earn credits')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('leaderboard')
                .setDescription('View event leaderboard')
        ),
    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();
        
        if (subcommand === 'dino') {
            await handleDino(interaction);
        } else if (subcommand === 'number') {
            await handleNumber(interaction);
        } else if (subcommand === 'vault') {
            await handleVault(interaction);
        } else if (subcommand === 'chat') {
            await handleChat(interaction);
        } else if (subcommand === 'leaderboard') {
            await handleLeaderboard(interaction);
        }
    }
};

async function handleDino(interaction) {
    try {
        const embed = createEmbed({
            title: '🦕 Dino Jump Game',
            description: 'Press 🦕 to start jumping over obstacles!\n\n**How to play:**\n1. Watch for obstacles (🌵)\n2. Press 🦕 to jump\n3. Avoid obstacles to earn points\n4. Higher score = more credits!',
            color: 0x00AE86,
            footer: { text: 'Game starts when you react with 🦕' }
        });
        
        const message = await interaction.reply({ 
            embeds: [embed], 
            fetchReply: true 
        });
        
        await message.react('🦕');
        
        let gameState = {
            isPlaying: false,
            score: 0,
            obstacles: [],
            playerJumping: false
        };
        
        const collector = message.createReactionCollector({
            filter: (reaction, user) => reaction.emoji.name === '🦕' && user.id === interaction.user.id,
            time: 60000
        });
        
        collector.on('collect', async (reaction, user) => {
            if (!gameState.isPlaying) {
                gameState.isPlaying = true;
                gameState.score = 0;
                
                await reaction.message.edit({
                    embeds: [createEmbed({
                        title: '🦕 Dino Jump Game - Playing!',
                        description: '🦕\n\nScore: 0',
                        color: 0x00FF00
                    })]
                });
                
                const gameInterval = setInterval(async () => {
                    if (gameState.isPlaying) {
                        gameState.score += 10;
                        
                        const obstacle = Math.random() > 0.5 ? '🌵' : '🪨';
                        gameState.obstacles.push(obstacle);
                        
                        if (gameState.obstacles.length > 3) {
                            gameState.obstacles.shift();
                        }
                        
                        const gameDisplay = gameState.obstacles.join(' ') + '\n🦕\n\nScore: ' + gameState.score;
                        
                        await reaction.message.edit({
                            embeds: [createEmbed({
                                title: '🦕 Dino Jump Game - Playing!',
                                description: gameDisplay,
                                color: 0x00FF00
                            })]
                        });
                        
                        if (Math.random() > 0.8) {
                            clearInterval(gameInterval);
                            gameState.isPlaying = false;
                            
                            const reward = Math.floor(gameState.score / 10) * 5;
                            await addCredits(
                                interaction.user.id,
                                interaction.guild.id,
                                reward,
                                'Dino game reward'
                            );
                            
                            await reaction.message.edit({
                                embeds: [createEmbed({
                                    title: '🦕 Game Over!',
                                    description: `Final Score: ${gameState.score}\nYou earned ${formatCredits(reward)}!`,
                                    color: 0xFF0000
                                })]
                            });
                        }
                    }
                }, 2000);
            }
        });
        
    } catch (error) {
        console.error('Dino game error:', error);
        await interaction.reply({
            embeds: [createErrorEmbed('Failed to start dino game.')],
            ephemeral: true
        });
    }
}

async function handleNumber(interaction) {
    try {
        const guess = interaction.options.getInteger('guess');
        const secretNumber = Math.floor(Math.random() * 100) + 1;
        
        const user = await getUser(interaction.user.id, interaction.guild.id);
        const attempts = user.lastDaily ? 1 : 1;
        
        if (guess === secretNumber) {
            const reward = 100;
            await addCredits(
                interaction.user.id,
                interaction.guild.id,
                reward,
                'Number game win'
            );
            
            const embed = createSuccessEmbed(
                `🎉 Congratulations! You guessed the number ${secretNumber}!\nYou earned ${formatCredits(reward)}!`,
                'Number Game - You Win!'
            );
            
            await interaction.reply({ embeds: [embed] });
        } else {
            const hint = guess < secretNumber ? 'higher' : 'lower';
            const embed = createEmbed({
                title: '❌ Wrong Guess',
                description: `The secret number is ${hint} than ${guess}.\nTry again with \`/event number\`!`,
                color: 0xFF0000
            });
            
            await interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
    } catch (error) {
        console.error('Number game error:', error);
        await interaction.reply({
            embeds: [createErrorEmbed('Failed to play number game.')],
            ephemeral: true
        });
    }
}

async function handleVault(interaction) {
    try {
        const code = interaction.options.getString('code');
        const secretCode = Math.random().toString().substring(2, 6);
        
        if (code === secretCode) {
            const reward = 500;
            await addCredits(
                interaction.user.id,
                interaction.guild.id,
                reward,
                'Vault crack success'
            );
            
            const embed = createSuccessEmbed(
                `🔓 Vault cracked! The code was ${secretCode}.\nYou earned ${formatCredits(reward)}!`,
                'Vault Cracked!'
            );
            
            await interaction.reply({ embeds: [embed] });
        } else {
            const embed = createEmbed({
                title: '🔒 Vault Locked',
                description: `Incorrect code: ${code}\nThe vault remains locked. Try again!`,
                color: 0xFF0000
            });
            
            await interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
    } catch (error) {
        console.error('Vault game error:', error);
        await interaction.reply({
            embeds: [createErrorEmbed('Failed to crack vault.')],
            ephemeral: true
        });
    }
}

async function handleChat(interaction) {
    try {
        const embed = createEmbed({
            title: '💬 Chat Event',
            description: 'Type messages in this channel to earn credits!\n\n**Rules:**\n• 1 credit per message\n• Max 50 credits per hour\n• No spam\n• Be creative and engaging!',
            color: 0x00AE86,
            footer: { text: 'Chat event active now!' }
        });
        
        await interaction.reply({ embeds: [embed] });
        
    } catch (error) {
        console.error('Chat event error:', error);
        await interaction.reply({
            embeds: [createErrorEmbed('Failed to start chat event.')],
            ephemeral: true
        });
    }
}

async function handleLeaderboard(interaction) {
    try {
        const topUsers = await models.User.findAll({
            order: [['totalEarned', 'DESC']],
            limit: 10
        });
        
        if (topUsers.length === 0) {
            return interaction.reply({
                embeds: [createErrorEmbed('No users found on leaderboard.')],
                ephemeral: true
            });
        }
        
        const leaderboard = topUsers.map((user, index) => {
            const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '🏅';
            return `${medal} **${user.username}**: ${formatCredits(user.totalEarned)}`;
        }).join('\n');
        
        const embed = createEmbed({
            title: '🏆 Event Leaderboard',
            description: leaderboard,
            color: 0xFFD700,
            footer: { text: 'Top earners across all events' }
        });
        
        await interaction.reply({ embeds: [embed] });
        
    } catch (error) {
        console.error('Leaderboard error:', error);
        await interaction.reply({
            embeds: [createErrorEmbed('Failed to fetch leaderboard.')],
            ephemeral: true
        });
    }
}
