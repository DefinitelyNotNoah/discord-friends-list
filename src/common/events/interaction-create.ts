import { DiscordEvent } from "../../helpers/api";
import { Events, Interaction } from "discord.js";
import {Player} from "../../helpers/player";

export const event: DiscordEvent<Interaction> = {
	name: Events.InteractionCreate,
	once: false,
	async execute(interaction: Interaction): Promise<void> {
		if (!interaction.isChatInputCommand()) return;

		// if (!await isUserRegistered(interaction.user.id) && interaction.commandName != "register") {
		// 	await interaction.reply("You can't access commands while not registered.");
		// 	return;
		// }
		if (!await Player.isRegistered(interaction.user.id) && interaction.commandName != "register") {
			await interaction.reply("You can't access commands while not registered.");
			return;
		}

		const command = interaction.client.commands.get(interaction.commandName);
		if (!command) {
			console.log(`No command matching ${interaction.commandName} was found.`)
			return;
		}
		await command.execute(interaction);
	}
}
