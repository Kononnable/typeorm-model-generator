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

@Entity("PostAuthor")
export class PostAuthor {
    @Column("int", {
        primary: true,
        name: "id"
    })
    id: number;

    @OneToMany(type => Post, Post => Post.id)
    posts: Post[];
}
