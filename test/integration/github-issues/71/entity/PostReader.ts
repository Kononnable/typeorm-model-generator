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

    @OneToOne(type => Post, Post => Post.Id)
    @JoinColumn()
    post:Post;

}
