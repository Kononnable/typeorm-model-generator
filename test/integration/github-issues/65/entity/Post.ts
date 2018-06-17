import {Index,Entity, PrimaryColumn, Column, OneToOne, OneToMany, ManyToOne, ManyToMany, JoinColumn, JoinTable} from "typeorm";
import { PostAuthor } from "./PostAuthor";
import { PostReader } from "./PostReader";


@Entity("Post")
export class Post {

    @Column("int",{
        nullable:false,
        primary:true,
        name:"Id"
        })
    Id:number;



    @OneToOne(type => PostAuthor, PostAuthor => PostAuthor.Id)
    postAuthor: PostAuthor;

    @OneToMany(type => PostReader, PostReader => PostReader.Id)
    postReaders: PostReader[];

}
