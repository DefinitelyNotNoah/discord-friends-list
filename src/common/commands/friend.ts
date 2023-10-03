import {Colors, CommandInteraction, EmbedBuilder, SlashCommandBuilder} from "discord.js";
import {SlashCommand} from "../../helpers/api";
import {Player} from "../../helpers/player";

export const command: SlashCommand = {
    data: new SlashCommandBuilder()
        .setName("friend")
        .setDescription("Manage your friends list")
        .addSubcommand((subcommand) => {
            return subcommand.setName("add")
                .setDescription("Add a friend using their discord ID or by mentioning them")
                .addStringOption((option) => {
                    return option.setName("id")
                        .setDescription("The ID of the specified user")
                        .setRequired(true);
                })
        })
        .addSubcommand((subcommand) => {
            return subcommand.setName("requests")
                .setDescription("View incoming friend requests")
        })
        .addSubcommand((subcommand) => {
            return subcommand.setName("list")
                .setDescription("View your friends list")
        })
        .addSubcommandGroup((group) => {
            return group.setName("remove")
                .setDescription("Remove a friend using their friend ID.")
                .addSubcommand((subcommand) => {
                    return subcommand.setName("player")
                        .setDescription("Removes a player specified by their friend ID")
                        .addNumberOption((option) => {
                            return option.setName("friend_id")
                                .setDescription("The friend ID (from your friend's list) of the specified user")
                                .setRequired(true);
                        })
                })
                .addSubcommand((subcommand) => {
                    return subcommand.setName("all")
                        .setDescription("Removes all friends from your friend's list")
                })
        })
        .addSubcommandGroup((group) => {
            return group.setName("accept")
                .setDescription("Accept a pending friend request.")
                .addSubcommand((subcommand) => {
                    return subcommand.setName("player")
                        .setDescription("Accepts a single pending friend request")
                        .addNumberOption((option) => {
                            return option.setName("accept_id")
                                .setDescription("The Accept ID of the friend request")
                                .setRequired(true)
                        })
                })
                .addSubcommand((subcommand) => {
                    return subcommand.setName("all")
                        .setDescription("Accepts all pending friend requests")
                })
        }) as SlashCommandBuilder,
    execute: async (interaction: CommandInteraction): Promise<void> => {
        if (!interaction.isChatInputCommand()) return;

        const player = new Player({
            id: interaction.user.id,
            interaction: interaction
        });

        switch (interaction.options.getSubcommand()) {
            case "add":
                const addId = interaction.options.getString("id")?.replace(/[^0-9]/g, "") as string;
                await player.friends.add(addId);
                return;
            case "list":
                const playerFields: { name: string, value: string, inline: boolean }[] = [];
                for (const friend of await player.friends.getList()) {
                    playerFields.push({
                        name: friend.name,
                        value: `**ID: ${friend.friendId}**`,
                        inline: true
                    });
                }
                const listEmbed = new EmbedBuilder()
                    .setColor(Colors.Blue)
                    .setTitle(`${interaction.user.username}'s Friend's List`)
                    .addFields(...playerFields);
                await interaction.reply({embeds: [ listEmbed ]});
                return;
            case "requests":
                const requestFields: { name: string, value: string, inline: boolean }[] = [];
                for (const request of await player.friends.getRequests()) {
                    requestFields.push({
                        name: `__${request.name}__`,
                        value: `**ID: ${request.acceptId}**`,
                        inline: true
                    });
                }
                const requestEmbed = new EmbedBuilder()
                    .setColor(Colors.Blue)
                    .setTitle(`${interaction.user.username}'s Pending Requests`)
                    .addFields(...requestFields);
                await interaction.reply({embeds: [ requestEmbed ]});
                return;
        }

        switch (interaction.options.getSubcommandGroup()) {
            case "accept":
                if (interaction.options.getSubcommand() == "player") {
                    const acceptId = interaction.options.getNumber("accept_id") as number;
                    let found: boolean = false;
                    for (const request of await player.friends.getRequests()) {
                        if (request.acceptId == acceptId) {
                            found = true;
                            await player.friends.accept(request);
                            await interaction.reply(`You are now friends with ${request.name}`);
                            return;
                        }
                    }
                    if (!found) {
                        await interaction.reply(`No accept ID matching ${acceptId} was found.`);
                        return;
                    }
                }
                if (interaction.options.getSubcommand() == "all") {
                    const requests = await player.friends.getRequests();
                    if (requests.length < 1) {
                        await interaction.reply("You have no pending friend requests.");
                        return;
                    }
                    await player.friends.acceptAll().then(async (length) =>
                        await interaction.reply(`You are now friends with \`${length}\` more player(s).`));
                }
                return;
            case "remove":
                if (interaction.options.getSubcommand() == "player") {
                    const friendId = interaction.options.getNumber("friend_id") as number;
                    let found: boolean = false;
                    for (const friend of await player.friends.getList()) {
                        if (friend.friendId == friendId) {
                            found = true;
                            await player.friends.remove(friend);
                            await interaction.reply(`${friend.name} has been removed from your friend's list.`);
                            return;
                        }
                    }
                    if (!found) {
                        await interaction.reply(`No friend ID matching ${friendId} was found.`);
                        return;
                    }
                }
                if (interaction.options.getSubcommand() == "all") {
                    const friends = await player.friends.getList();
                    if (friends.length < 1) {
                        await interaction.reply("There are no friends in your friend's list.");
                        return;
                    }
                    await player.friends.removeAll().then(async (length) =>
                        await interaction.reply(`You have removed \`${length}\` player(s).`));
                }
                return;
        }
    }
}