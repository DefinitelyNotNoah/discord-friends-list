import {CommandInteraction, SlashCommandBuilder} from "discord.js";
import {ProfileModel, ProfileSchema} from "../../models/profile-model";
import {SlashCommand} from "../../helpers/api";
import {Player} from "../../helpers/player";

export const command: SlashCommand = {
    data: new SlashCommandBuilder()
        .setName("register")
        .setDescription("Register into the database") as SlashCommandBuilder,
    execute: async (interaction: CommandInteraction): Promise<void> => {
        if (!interaction.isChatInputCommand()) return;

        if (!await Player.isRegistered(interaction.user.id)) {
            const playerData: ProfileSchema = {
                _id: interaction.user.id,
                name: interaction.user.username,
                friends: {
                    requests: [],
                    list: [],
                }
            };
            await ProfileModel.findOneAndUpdate(
                {_id: interaction.user.id},
                {$set: {...playerData}},
                {new: true, upsert: true}
            ).then(async () => await interaction.reply("Successfully Registered"));
        } else {
            await interaction.reply("You are already registered.")
        }
    }
}