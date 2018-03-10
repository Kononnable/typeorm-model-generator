import {Index,Entity, PrimaryColumn, Column, OneToOne, OneToMany, ManyToOne, JoinColumn} from "typeorm";
import {Post} from "./Post";


@Entity("User",{schema:"sch2"})
export class User {

    @Column("integer",{
        nullable:false,
        primary:true,
        name:"id"
        })
    id:number;


    @Column("text",{
        nullable:true,
        name:"name"
        })
    name:string;



    @OneToMany(type=>Post, posts=>posts.userId)
    posts:Post[];

}
