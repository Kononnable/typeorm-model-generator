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

@Entity("PostReader")
export class PostReader {
    @Column("int", {
        primary: true,
        name: "id"
    })
    id: number;

    @OneToOne(
        type => Post,
        Post => Post.id
    )
    @JoinColumn()
    post: Post;
}
