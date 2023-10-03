import {CommandInteraction, Events, SlashCommandBuilder} from "discord.js";

export interface SlashCommand {
	data: SlashCommandBuilder,
	execute: (interaction: CommandInteraction) => Promise<void>,
}

export interface DiscordEvent<T> {
	name: Events,
	once: boolean,
	execute: (arg: T) => Promise<void>,
}
