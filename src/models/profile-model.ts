import mongoose, {Model, Schema} from "mongoose";

export interface ProfileSchema {
    _id: string,
    name: string,
    friends: {
        list: FriendInformationSchema[],
        requests: FriendRequestSchema[],
    }
}

export interface FriendInformationSchema {
    _id: string,
    name: string,
    friendId: number,
}

export interface FriendRequestSchema extends FriendInformationSchema {
    acceptId: number
}

const friendModel: Schema<FriendInformationSchema> = new Schema({
    _id: String,
    name: String,
    friendId: Number,
});

const friendRequestSchema: Schema<FriendRequestSchema> = new Schema({
    _id: String,
    name: String,
    acceptId: Number,
});

const profileSchema: Schema<ProfileSchema> = new Schema({
    _id: String,
    name: String,
    friends: {
        list: [friendModel],
        requests: [friendRequestSchema]
    }
})

export const ProfileModel: Model<ProfileSchema> = mongoose.model("Profile", profileSchema, "profiles");

