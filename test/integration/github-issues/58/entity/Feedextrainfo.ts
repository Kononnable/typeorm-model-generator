import {
    Index,
    Entity,
    PrimaryColumn,
    Column,
    OneToOne,
    OneToMany,
    ManyToOne,
    ManyToMany,
    JoinColumn,
    JoinTable
} from "typeorm";
import { Users } from "./Users";
import { Quests } from "./Quests";

@Entity("feedextrainfo")
@Index("feedExtraInfo_FeedOwnerId_idx", ["feedOwnerId"], { unique: true })
@Index("feedExtraInfo_ReaderId_idx", ["readerId"], { unique: true })
@Index("feedExtraInfo_QuestId_idx", ["questId"], { unique: true })
export class Feedextrainfo {
    @PrimaryColumn({ name: "FeedOwnerId" })
    feedOwnerId: number;

    @PrimaryColumn({ name: "QuestId" })
    questId: number;

    @PrimaryColumn({ name: "ReaderId" })
    readerId: number;

    @OneToOne(type => Users, FeedOwnerId => FeedOwnerId.feedextrainfo)
    @JoinColumn({ name: "FeedOwnerId" })
    feedOwner: Users;

    @OneToOne(type => Quests, QuestId => QuestId.feedextrainfo)
    @JoinColumn({ name: "QuestId" })
    quest: Quests;

    @OneToOne(type => Users, ReaderId => ReaderId.feedextrainfo2)
    @JoinColumn({ name: "ReaderId" })
    reader: Users;

    @Column("int", {
        name: "MostUpdatedFeedEntryIdUserRead"
    })
    mostUpdatedFeedEntryIdUserRead: number;
}
