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

@Entity("users")
export class Users {
    @Column("int", {
        primary: true,
        name: "UserId"
    })
    userId: number;

    @OneToOne(type => Feedextrainfo, feedextrainfo => feedextrainfo.feedOwner)
    feedextrainfo: Feedextrainfo;

    @OneToOne(type => Feedextrainfo, feedextrainfo2 => feedextrainfo2.reader)
    feedextrainfo2: Feedextrainfo;
}
