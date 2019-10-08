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
import { feedextrainfo } from "./feedextrainfo";

@Entity("quests")
export class quests {
    @Column("int", {
        primary: true,
        name: "QuestId"
    })
    questId: number;

    @OneToOne(type => feedextrainfo, feedextrainfo => feedextrainfo.quest)
    feedextrainfo: feedextrainfo;
}
