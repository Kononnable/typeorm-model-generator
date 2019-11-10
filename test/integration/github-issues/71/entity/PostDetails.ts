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
    JoinTable,
    RelationId
} from "typeorm";
import { Post } from "./Post";

@Entity("PostDetails")
export class PostDetails {
    @Column("int", {
        primary: true,
        name: "id"
    })
    id: number;

    @OneToOne(type => Post, Post => Post.id, {
        // onDelete: "SET NULL"
        // onUpdate: "SET NULL"
    })
    @JoinColumn()
    post: Post;
}
