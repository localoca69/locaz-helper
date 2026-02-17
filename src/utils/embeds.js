const { EmbedBuilder, Colors } = require('discord.js');

function createEmbed(options = {}) {
    const embed = new EmbedBuilder()
        .setColor(options.color || Colors.Blue)
        .setTimestamp(options.timestamp || new Date());

    if (options.title) embed.setTitle(options.title);
    if (options.description) embed.setDescription(options.description);
    if (options.url) embed.setURL(options.url);
    if (options.author) embed.setAuthor(options.author);
    if (options.thumbnail) embed.setThumbnail(options.thumbnail);
    if (options.image) embed.setImage(options.image);
    if (options.footer) embed.setFooter(options.footer);
    if (options.fields) embed.addFields(options.fields);

    return embed;
}

function createSuccessEmbed(description, title = 'Success') {
    return createEmbed({
        title,
        description,
        color: Colors.Green
    });
}

function createErrorEmbed(description, title = 'Error') {
    return createEmbed({
        title,
        description,
        color: Colors.Red
    });
}

function createWarningEmbed(description, title = 'Warning') {
    return createEmbed({
        title,
        description,
        color: Colors.Yellow
    });
}

function createInfoEmbed(description, title = 'Information') {
    return createEmbed({
        title,
        description,
        color: Colors.Blue
    });
}

module.exports = {
    createEmbed,
    createSuccessEmbed,
    createErrorEmbed,
    createWarningEmbed,
    createInfoEmbed
};
