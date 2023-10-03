import { DiscordEvent } from "../../helpers/api";
import {Client, Events } from "discord.js";

export const event: DiscordEvent<Client> = {
	name: Events.ClientReady,
	once: true,
	async execute(client: Client<true>): Promise<void> {
		console.log(`${client.user.tag} Online.`)
	}
}