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

@Entity("PostCategory")
export class PostCategory {
    @Column("int", {
        primary: true,
        name: "id"
    })
    id: number;

    @OneToOne(type => Post, Post => Post.id, {
        // onDelete: "RESTRICT",
        // onUpdate: "RESTRICT"
    })
    @JoinColumn()
    post: Post;
}
