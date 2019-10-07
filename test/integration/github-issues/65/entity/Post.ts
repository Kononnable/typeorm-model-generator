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
import { PostAuthor } from "./PostAuthor";
import { PostReader } from "./PostReader";

@Entity("Post")
export class Post {
    @Column("int", {
        primary: true,
        name: "id"
    })
    id: number;

    @OneToOne(type => PostAuthor, PostAuthor => PostAuthor.id)
    postAuthor: PostAuthor;

    @OneToMany(type => PostReader, PostReader => PostReader.id)
    postReaders: PostReader[];
}
