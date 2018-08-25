import { Index, Entity, PrimaryColumn, Column, OneToOne, OneToMany, ManyToOne, ManyToMany, JoinColumn, JoinTable } from "typeorm";
import { PostReader } from "./PostReader";
import { PostAuthor } from "./PostAuthor";
import { PostCategory } from "./PostCategory";
import { PostDetails } from "./PostDetails";


@Entity("Post")
export class Post {

    @Column("int", {
        nullable: false,
        primary: true,
        name: "Id"
    })
    Id: number;

    @OneToOne(type => PostAuthor, PostAuthor => PostAuthor.Id,
        {
            // onDelete: "CASCADE",
            // onUpdate: "CASCADE"
        })
    postAuthor: PostAuthor;

    @OneToOne(type => PostReader, PostReader => PostReader.Id)
    postReader: PostReader;

    @OneToOne(type => PostCategory, PostCategory => PostCategory.Id,
        {
            // onDelete: "RESTRICT",
            // onUpdate: "RESTRICT"
        })
    postCategory: PostCategory;

    @OneToOne(type => PostDetails, PostDetails => PostDetails.Id,
        {
            // onDelete: "SET NULL",
            // onUpdate: "SET NULL"
        })
    postDetails: PostDetails;
}
