import { CommandInteraction, SlashCommandBuilder, TextChannel } from "discord.js";
import { SlashCommand } from "../../helpers/api";

export const command: SlashCommand = {
    data: new SlashCommandBuilder()
        .setName("create")
        .setDescription("Creates a thread"),
    execute: async (interaction: CommandInteraction) => {
        if (!interaction.isChatInputCommand()) return;

        const channel = interaction.channel as TextChannel
        if (!channel.isThread()) {
            const test = await channel.threads.create({
                name: "test",
                reason: "testing reason",
                type: 12,
                invitable: false,
                autoArchiveDuration: 60,
            });
            await test.members.add(interaction.user.id);
            await interaction.reply(`Thread Created: ${channel.name}`);
        } else {
            await interaction.reply(`Cannot create thread inside a thread.`);
        }
    }
}