import {Client} from "discord.js";
import * as mongoose from "mongoose";
import config from "../config.json";
import fs from "fs";
require("./helpers/prototype");

const client: Client = new Client({
	intents: ["Guilds", "MessageContent", "GuildMessages"],
});

mongoose.connect("mongodb://localhost:27017/testing").then(() => {
	console.log("MongoDB Connection Established");
});

const commandsPath = "./common/commands";
const commandsFile = fs.readdirSync(commandsPath);
const eventsPath = "./common/events";
const eventFiles = fs.readdirSync(eventsPath);

for (const file of commandsFile) {
	const importedFile = require(`${commandsPath}/${file}`);
	console.log(`Searching command: ${importedFile.command.data.name}`);
	if ("command" in importedFile)
		client.commands.set(importedFile.command.data.name, importedFile.command);
}

for (const file of eventFiles) {
	const importedFile = require(`${eventsPath}/${file}`);
	if ("event" in importedFile) {
		if (importedFile.event.once)
			client.once(importedFile.event.name, (...args) => importedFile.event.execute(...args));
		else
			client.on(importedFile.event.name, (...args) => importedFile.event.execute(...args));
	}
}

client.login(config.token).then(() => {});
