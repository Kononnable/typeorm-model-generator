import {
    Index,
    Entity,
    PrimaryColumn,
    Column,
    OneToOne,
    OneToMany,
    ManyToOne,
    JoinColumn
} from "typeorm";
import { User } from "./User";

@Entity("Post", { schema: "sch1" })
export class Post {
    @Column("integer", {
        primary: true,
        name: "id"
    })
    id: number;

    @ManyToOne(type => User, user => user.posts)
    @JoinColumn({ name: "userId" })
    user: User;

    @Column("text", {
        nullable: true,
        name: "body"
    })
    body: string;
}
