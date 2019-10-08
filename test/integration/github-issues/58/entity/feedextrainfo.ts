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
import { users } from "./users";
import { quests } from "./quests";

@Entity("feedextrainfo")
@Index("feedExtraInfo_FeedOwnerId_idx", ["feedOwnerId"], { unique: true })
@Index("feedExtraInfo_ReaderId_idx", ["readerId"], { unique: true })
@Index("feedExtraInfo_QuestId_idx", ["questId"], { unique: true })
export class feedextrainfo {
    @PrimaryColumn({ name: "FeedOwnerId" })
    feedOwnerId: number;

    @PrimaryColumn({ name: "QuestId" })
    questId: number;

    @PrimaryColumn({ name: "ReaderId" })
    readerId: number;

    @OneToOne(type => users, FeedOwnerId => FeedOwnerId.feedextrainfo)
    @JoinColumn({ name: "FeedOwnerId" })
    feedOwner: users;

    @OneToOne(type => quests, QuestId => QuestId.feedextrainfo)
    @JoinColumn({ name: "QuestId" })
    quest: quests;

    @OneToOne(type => users, ReaderId => ReaderId.feedextrainfo2)
    @JoinColumn({ name: "ReaderId" })
    reader: users;

    @Column("int", {
        name: "MostUpdatedFeedEntryIdUserRead"
    })
    mostUpdatedFeedEntryIdUserRead: number;
}
