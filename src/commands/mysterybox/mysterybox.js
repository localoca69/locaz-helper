const { SlashCommandBuilder } = require('discord.js');
const { createSuccessEmbed, createErrorEmbed, createEmbed } = require('../../utils/embeds');
const { getUser, removeCredits, addCredits, formatCredits } = require('../../utils/helpers');
const { models } = require('../../handlers/databaseHandler');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('mysterybox')
        .setDescription('Buy and open mystery boxes')
        .addSubcommand(subcommand =>
            subcommand
                .setName('buy')
                .setDescription('Buy a mystery box')
                .addStringOption(option =>
                    option.setName('type')
                        .setDescription('Type of mystery box')
                        .addChoices(
                            { name: 'Common (100 credits)', value: 'common' },
                            { name: 'Rare (250 credits)', value: 'rare' },
                            { name: 'Epic (500 credits)', value: 'epic' },
                            { name: 'Legendary (1000 credits)', value: 'legendary' }
                        )
                        .setRequired(true)
                )
                .addIntegerOption(option =>
                    option.setName('quantity')
                        .setDescription('Number of boxes to buy')
                        .setMinValue(1)
                        .setMaxValue(10)
                        .setRequired(false)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('open')
                .setDescription('Open a mystery box')
                .addIntegerOption(option =>
                    option.setName('quantity')
                        .setDescription('Number of boxes to open')
                        .setMinValue(1)
                        .setMaxValue(10)
                        .setRequired(false)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('inventory')
                .setDescription('View your mystery box inventory')
        ),
    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();
        
        if (subcommand === 'buy') {
            await handleBuy(interaction);
        } else if (subcommand === 'open') {
            await handleOpen(interaction);
        } else if (subcommand === 'inventory') {
            await handleInventory(interaction);
        }
    }
};

async function handleBuy(interaction) {
    try {
        const boxType = interaction.options.getString('type');
        const quantity = interaction.options.getInteger('quantity') || 1;
        
        const prices = {
            common: 100,
            rare: 250,
            epic: 500,
            legendary: 1000
        };
        
        const price = prices[boxType];
        const totalPrice = price * quantity;
        
        const user = await getUser(interaction.user.id, interaction.guild.id);
        
        if (user.credits < totalPrice) {
            return interaction.reply({
                embeds: [createErrorEmbed(`You need ${formatCredits(totalPrice)} to buy ${quantity} ${boxType} box(es).`)],
                ephemeral: true
            });
        }
        
        await removeCredits(
            interaction.user.id,
            interaction.guild.id,
            totalPrice,
            `Purchased ${quantity} ${boxType} mystery box(es)`
        );
        
        await user.update({
            mysteryBoxes: user.mysteryBoxes + quantity
        });
        
        const embed = createSuccessEmbed(
            `You purchased ${quantity} ${boxType} mystery box(es) for ${formatCredits(totalPrice)}!\nYou now have ${user.mysteryBoxes + quantity} mystery boxes.`,
            'Mystery Box Purchase'
        );
        
        await interaction.reply({ embeds: [embed] });
        
    } catch (error) {
        console.error('Buy mystery box error:', error);
        await interaction.reply({
            embeds: [createErrorEmbed('Failed to purchase mystery box.')],
            ephemeral: true
        });
    }
}

async function handleOpen(interaction) {
    try {
        const quantity = interaction.options.getInteger('quantity') || 1;
        
        const user = await getUser(interaction.user.id, interaction.guild.id);
        
        if (user.mysteryBoxes < quantity) {
            return interaction.reply({
                embeds: [createErrorEmbed(`You only have ${user.mysteryBoxes} mystery box(es).`)],
                ephemeral: true
            });
        }
        
        const rewards = [];
        let totalReward = 0;
        
        for (let i = 0; i < quantity; i++) {
            const reward = generateReward();
            rewards.push(reward);
            totalReward += reward.amount;
        }
        
        await user.update({
            mysteryBoxes: user.mysteryBoxes - quantity
        });
        
        await addCredits(
            interaction.user.id,
            interaction.guild.id,
            totalReward,
            `Opened ${quantity} mystery box(es)`
        );
        
        const embed = createEmbed({
            title: '🎁 Mystery Box Opened!',
            description: `You opened ${quantity} mystery box(es) and won ${formatCredits(totalReward)}!`,
            color: 0x00AE86,
            fields: rewards.map((reward, index) => ({
                name: `Box ${index + 1}`,
                value: `${reward.emoji} ${reward.name}: ${formatCredits(reward.amount)}`,
                inline: true
            }))
        });
        
        await interaction.reply({ embeds: [embed] });
        
    } catch (error) {
        console.error('Open mystery box error:', error);
        await interaction.reply({
            embeds: [createErrorEmbed('Failed to open mystery box.')],
            ephemeral: true
        });
    }
}

async function handleInventory(interaction) {
    try {
        const user = await getUser(interaction.user.id, interaction.guild.id);
        
        const embed = createEmbed({
            title: '🎁 Mystery Box Inventory',
            description: `You have **${user.mysteryBoxes}** mystery box(es)`,
            color: 0x00AE86,
            fields: [
                {
                    name: 'Available Boxes',
                    value: `${user.mysteryBoxes} boxes`,
                    inline: true
                },
                {
                    name: 'Current Balance',
                    value: formatCredits(user.credits),
                    inline: true
                }
            ]
        });
        
        await interaction.reply({ embeds: [embed] });
        
    } catch (error) {
        console.error('Mystery box inventory error:', error);
        await interaction.reply({
            embeds: [createErrorEmbed('Failed to fetch inventory.')],
            ephemeral: true
        });
    }
}

function generateReward() {
    const rewards = [
        { emoji: '💰', name: 'Small Prize', amount: Math.floor(Math.random() * 50) + 10 },
        { emoji: '💎', name: 'Medium Prize', amount: Math.floor(Math.random() * 100) + 50 },
        { emoji: '🏆', name: 'Large Prize', amount: Math.floor(Math.random() * 200) + 100 },
        { emoji: '⭐', name: 'Super Prize', amount: Math.floor(Math.random() * 500) + 200 }
    ];
    
    const weights = [40, 30, 20, 10];
    const totalWeight = weights.reduce((a, b) => a + b, 0);
    
    let random = Math.random() * totalWeight;
    
    for (let i = 0; i < rewards.length; i++) {
        random -= weights[i];
        if (random <= 0) {
            return rewards[i];
        }
    }
    
    return rewards[0];
}
