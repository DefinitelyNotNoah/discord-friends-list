import {SlashCommand} from "./api";
import {Client} from "discord.js";

declare module "discord.js" {
    interface Client {
        commands: Map<string, SlashCommand>;
    }
}

Client.prototype.commands = new Map();