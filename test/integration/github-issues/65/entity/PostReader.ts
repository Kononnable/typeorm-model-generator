import {Index,Entity, PrimaryColumn, Column, OneToOne, OneToMany, ManyToOne, ManyToMany, JoinColumn, JoinTable, RelationId} from "typeorm";
import { Post } from "./Post";


@Entity("PostReader")
export class PostReader {

    @Column("int",{
        nullable:false,
        primary:true,
        name:"Id"
        })
    Id:number;

    @ManyToOne(type => Post, Post => Post.Id)
    @JoinColumn()
    post:Post;

    @RelationId((postReader: PostReader) => postReader.post)
    postId: number[];
}
