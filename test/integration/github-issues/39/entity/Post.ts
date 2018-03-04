import {Index,Entity, PrimaryColumn, Column, OneToOne, OneToMany, ManyToOne, JoinColumn} from "typeorm";
import {User} from "./User";


@Entity("Post",{schema:"sch1"})
export class Post {

    @Column("integer",{
        nullable:false,
        primary:true,
        name:"id"
        })
    id:number;



    @ManyToOne(type=>User, userId=>userId.posts)
    @JoinColumn({ name:"userId"})
    userId:User;


    @Column("text",{
        nullable:true,
        name:"body"
        })
    body:string;

}
