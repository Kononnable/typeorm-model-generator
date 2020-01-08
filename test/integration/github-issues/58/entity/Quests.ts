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
import { Feedextrainfo } from "./Feedextrainfo";

@Entity("quests")
export class Quests {
    @Column("int", {
        primary: true,
        name: "QuestId"
    })
    questId: number;

    @OneToOne(type => Feedextrainfo, feedextrainfo => feedextrainfo.quest)
    feedextrainfo: Feedextrainfo;
}
