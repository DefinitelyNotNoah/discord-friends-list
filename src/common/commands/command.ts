import {CommandInteraction, REST, Routes, SlashCommandBuilder} from "discord.js";
import * as config from "../../../config.json";
import fs from "fs";
import {SlashCommand} from "../../helpers/api";


export const command: SlashCommand = {
    data: new SlashCommandBuilder()
        .setName("command")
        .setDescription("Command manipulation")
        .addSubcommand((subcommand) => {
            return subcommand.setName("deploy")
                .setDescription("Access an instance of the REST module to deploy all commands to discord")
        })
        .addSubcommand((subcommand) => {
            return subcommand.setName("reload")
                .setDescription("Reloads all registered commands.")
        })
        .addSubcommandGroup((group) => {
            return group.setName("delete")
                .setDescription("Deletes an already registered command given its ID, or optionally, all commands")
                .addSubcommand((subcommand) => {
                    return subcommand.setName("id")
                        .setDescription("Delete a command given its specified ID")
                        .addStringOption((option) => {
                            return option.setName("id")
                                .setDescription("The ID of the command")
                                .setRequired(true)
                        })
                })
                .addSubcommand((subcommand) => {
                    return subcommand.setName("all")
                        .setDescription("Deletes all registered commands")
                        .addBooleanOption((option) => {
                            return option.setName("guild")
                                .setDescription("Deletes all commands in current guild.");
                        })
                })
        }) as SlashCommandBuilder,
    execute: async (interaction: CommandInteraction): Promise<void> => {
        if (!interaction.isChatInputCommand()) return;

        const rest = new REST().setToken(config.token);
        const guildID = interaction.guildId as string;
        const commandFiles = fs.readdirSync(__dirname);

        if (interaction.options.getSubcommand() == "deploy") {
            const commandBody: SlashCommandBuilder[] = [];
            // Deploying commands
            let commandCount = 0;
            for (const file of commandFiles) {
                if (file.endsWith(".ts")) {
                    delete require.cache[require.resolve(`${__dirname}/${file}`)];
                    const importedFile = require(`${__dirname}/${file}`);
                    if ("command" in importedFile) {
                        commandCount++;
                        console.log(`${file} contains a valid command -> ${importedFile.command.data.name}`);
                        commandBody.push(importedFile.command.data.toJSON());
                    }
                }
            }
            await interaction.reply(`Refreshed ${commandCount} commands.`);
            await rest.put(Routes.applicationCommands(config.clientId), {
                body: commandBody,
            });
        }

        if (interaction.options.getSubcommand() == "reload") {
            interaction.client.commands.clear();
            for (const file of commandFiles) {
                delete require.cache[require.resolve(`${__dirname}/${file}`)];
                const importedFile = require(`${__dirname}/${file}`);
                if ("command" in importedFile) {
                    console.log(`Reloading command: ${importedFile.command.data.name}`);
                    interaction.client.commands.set(importedFile.command.data.name, importedFile.command);
                }
            }
            await interaction.reply(`${interaction.client.commands.size} commands reloaded.`);
        }

        // Deleting commands.
        if (interaction.options.getSubcommandGroup() == "delete") {
            if (interaction.options.getSubcommand() == "id") {
                const commandID: string = interaction.options.getString("id") as string;

                await rest.delete(Routes.applicationCommand(config.clientId, commandID))
                    .then(async () => await interaction.reply("Successfully deleted command"))
                    .catch(console.error);
            }
            if (interaction.options.getSubcommand() == "all") {
                if (interaction.options.getBoolean("guild") == false) {
                    await rest.put(Routes.applicationCommands(config.clientId), { body: [] })
                        .then(async () => await interaction.reply("Successfully deleted all commands."))
                        .catch(console.error);
                } else {
                    await rest.put(Routes.applicationGuildCommands(config.clientId, guildID), { body: [] })
                        .then(async () => await interaction.reply("Successfully deleted all guild commands."))
                        .catch(console.error);
                }
            }
        }
    }
}