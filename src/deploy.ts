import { REST, Routes, SlashCommandBuilder } from "discord.js";
import fs from "fs";
import config from "../config.json";

const commandsPath = "./common/commands";
const commandsFile = fs.readdirSync(commandsPath);
const rest = new REST().setToken(config.token);

(async () => {
    const commandBody: SlashCommandBuilder[] = [];
    for (const file of commandsFile) {
        if (file.endsWith(".ts")) {
            delete require.cache[require.resolve(`${commandsPath}/${file}`)];
            console.log("Checking file " + file);
            const importedFile = require(`${commandsPath}/${file}`)
            if ("command" in importedFile) {
                console.log(`${file} contains a valid command -> ${importedFile.command.data.name}`);
                commandBody.push(importedFile.command.data.toJSON());
            }
        }
    }
    await rest.put(Routes.applicationCommands(config.clientId), {
        body: commandBody,
    });
})();
