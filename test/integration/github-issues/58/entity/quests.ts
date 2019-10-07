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
    QuestId: number;

    @OneToOne(type => feedextrainfo, feedextrainfo => feedextrainfo.questId)
    feedextrainfo: feedextrainfo;
}
