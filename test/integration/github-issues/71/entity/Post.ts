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
import { PostReader } from "./PostReader";
import { PostAuthor } from "./PostAuthor";
import { PostCategory } from "./PostCategory";
import { PostDetails } from "./PostDetails";

@Entity("Post")
export class Post {
    @Column("int", {
        // nullable: false,
        primary: true,
        name: "id"
    })
    id: number;

    @OneToOne(type => PostAuthor, PostAuthor => PostAuthor.id, {
        // onDelete: "CASCADE",
        // onUpdate: "CASCADE"
    })
    postAuthor: PostAuthor;

    @OneToOne(type => PostReader, PostReader => PostReader.id)
    postReader: PostReader;

    @OneToOne(type => PostCategory, PostCategory => PostCategory.id, {
        // onDelete: "RESTRICT",
        // onUpdate: "RESTRICT"
    })
    postCategory: PostCategory;

    @OneToOne(type => PostDetails, PostDetails => PostDetails.id, {
        // onDelete: "SET NULL",
        // onUpdate: "SET NULL"
    })
    postDetails: PostDetails;
}
