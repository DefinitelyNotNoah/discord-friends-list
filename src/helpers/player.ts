import {CommandInteraction} from "discord.js";
import {FriendInformationSchema, FriendRequestSchema, ProfileModel} from "../models/profile-model";

class Friend {
    private readonly _playerId: string;
    private readonly _interaction: CommandInteraction;

    constructor(id: string, interaction: CommandInteraction) {
        this._playerId = id;
        this._interaction = interaction;
    }

    public async getAcceptId(friendId: string): Promise<number> {
        const playerProfile = await ProfileModel.find({_id: this._playerId});
        for (const request of playerProfile[0].friends.requests) {
            if (request._id == friendId) {
                return request.acceptId;
            }
        }
        return -1;
    }

    async getRequests(): Promise<FriendRequestSchema[]> {
        return await ProfileModel.find({_id: this._playerId}).then((doc) => {
            return doc[0].friends.requests;
        });
    }

    async getList(): Promise<FriendInformationSchema[]> {
        return await ProfileModel.find({_id: this._playerId}).then((doc) => {
           return doc[0].friends.list;
        });
    }

    public async accept(request: FriendRequestSchema): Promise<void> {
        const player = new Player({
            id: this._playerId,
            interaction: this._interaction,
        });
        const friend = new Player({
            id: request._id,
            interaction: this._interaction
        });
        await ProfileModel.updateOne({_id: this._playerId}, {
            $push: {
                "friends.list": {
                    _id: request._id,
                    name: request.name,
                    friendId: await player.friends.getList().then((list) => list.length),
                } as FriendInformationSchema
            },
            $pull: {
                "friends.requests": {
                    acceptId: request.acceptId,
                } as FriendRequestSchema
            }
        });
        await ProfileModel.updateOne({_id: request._id}, {
            $push: {
                "friends.list": {
                    _id: this._playerId,
                    name: this._interaction.user.username,
                    friendId: await friend.friends.getList().then((list) => list.length),
                } as FriendInformationSchema
            }
        })
        return;
    }

    public async acceptAll(): Promise<number> {
        const player = new Player({
            id: this._playerId,
            interaction: this._interaction
        });
        let acceptCount = 0;
        for (const request of await this.getRequests()) {
            await player.friends.accept(request);
            acceptCount++;
        }
        return acceptCount;
    }

    protected async reject(acceptId: string): Promise<void> {
        console.log(acceptId);
        console.log(this._playerId);
    }

    public async rejectAll(): Promise<void> {
        console.log(this._playerId);
    }

    public async add(friendId: string): Promise<void> {
        const player: Player = new Player({
            id: this._interaction.user.id,
            interaction: this._interaction
        });
        const friend: Player = new Player({
            id: friendId,
            interaction: this._interaction
        });

        switch (true) {
            case !Number(friendId):
                await this._interaction.reply("Invalid ID, ensure the ID is a valid discord ID. Mentioning a user works too!")
                return;
            case !await Player.isRegistered(friendId):
                await this._interaction.reply(`Unable to add ${friendId}. This user is not yet registered.`);
                return;
            case await friend.isAwaitingAcceptance(this._playerId):
                const requests = await player.friends.getRequests();
                const request = requests.find(async (request) =>
                    request.acceptId == await player.friends.getAcceptId(friendId)) as FriendRequestSchema;
                await player.friends.accept(request);
                await this._interaction.reply(`You are now friends with ${request.name}`);
                return;
            case await player.hasRelationshipWith(friendId) || await player.isAwaitingAcceptance(friendId):
                await this._interaction.reply("The user you're trying to add is already a friend, or has a pending request from you.")
                return;
            case friendId == this._playerId:
                await this._interaction.reply("Good try, but you can't add yourself.");
                return;
            default:
                await ProfileModel.updateOne({_id: friendId}, {
                    $push: {
                        "friends.requests": {
                            _id: this._interaction.user.id,
                            name: this._interaction.user.username,
                            acceptId: await player.friends.getRequests()
                                .then((requests) => requests.length),
                        }
                    }
                }).then(async () => await this._interaction.reply("Friend request sent."))
        }
    }

    async remove(friend: FriendInformationSchema): Promise<void> {
        await ProfileModel.updateOne({_id: this._playerId}, {
            $pull: {
                "friends.list": {
                    friendId: friend.friendId
                } as FriendInformationSchema
            }
        });
        await ProfileModel.updateOne({_id: friend._id}, {
            $pull: {
                "friends.list": {
                    _id: this._playerId
                } as FriendInformationSchema
            }
        })
    }
    public async removeAll(): Promise<number> {
            const player = new Player({
            id: this._playerId,
            interaction: this._interaction
        });
        let removeCount = 0;
        for (const friend of await this.getList()) {
            await player.friends.remove(friend);
            removeCount++;
        }
        return removeCount;
    }
}

export class Player {
    private readonly _playerId: string;
    private readonly _friends: Friend;

    constructor(options: { id: string, interaction: CommandInteraction }) {
        this._playerId = options.id;
        this._friends = new Friend(options.id, options.interaction);
    }

    public get friends() {
        return this._friends;
    }

    public static async isRegistered(id: string): Promise<boolean> {
        return await ProfileModel.countDocuments({_id: id}, {limit: 1}) == 1;
    }

    public async isAwaitingAcceptance(friendId: string): Promise<boolean> {
        return await ProfileModel.count({
            _id: friendId,
            "friends.requests": {$elemMatch: {_id: this._playerId}}
        }) > 0;
    }

    public async hasRelationshipWith(friendId: string): Promise<boolean> {
        return await ProfileModel.count({
            _id: friendId,
            "friends.list": {$elemMatch: {_id: this._playerId}}
        }) > 0;
    }
}