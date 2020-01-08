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

@Entity("Section")
export class Section {
    @Column("int", {
        primary: true,
        name: "work"
    })
    work: number;

    @Column("int", {
        primary: true,
        name: "section"
    })
    section: number;

    @OneToOne(type => Post, Post => Post.id)
    post: Post;
}
