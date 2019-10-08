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

@Entity("users")
export class users {
    @Column("int", {
        primary: true,
        name: "UserId"
    })
    userId: number;

    @OneToOne(type => feedextrainfo, feedextrainfo => feedextrainfo.feedOwner)
    feedextrainfo: feedextrainfo;

    @OneToOne(type => feedextrainfo, feedextrainfo2 => feedextrainfo2.reader)
    feedextrainfo2: feedextrainfo;
}
