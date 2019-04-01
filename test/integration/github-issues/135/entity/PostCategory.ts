import {Index,Entity, PrimaryColumn, Column, OneToOne, OneToMany, ManyToOne, ManyToMany, JoinColumn, JoinTable, RelationId} from "typeorm";
import { Post } from "./Post";


@Entity("PostCategory")
export class PostCategory {

    @Column("int",{
        nullable:false,
        primary:true,
        name:"Id"
        })
    Id:number;



    @OneToMany(type => Post, Post => Post.Id)
    posts:Post[];

}
