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
    @OneToOne(type => users, FeedOwnerId => FeedOwnerId.feedextrainfo, {
        primary: true
    })
    @JoinColumn({ name: "FeedOwnerId" })
    feedOwnerId: users;

    @OneToOne(type => quests, QuestId => QuestId.feedextrainfo, {
        primary: true
    })
    @JoinColumn({ name: "QuestId" })
    questId: quests;

    @OneToOne(type => users, ReaderId => ReaderId.feedextrainfo2, {
        primary: true
    })
    @JoinColumn({ name: "ReaderId" })
    readerId: users;

    @Column("int", {
        name: "MostUpdatedFeedEntryIdUserRead"
    })
    MostUpdatedFeedEntryIdUserRead: number;
}
