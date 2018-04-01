import { PrimaryGeneratedColumn, Column, Entity, OneToOne, OneToMany, ManyToOne, ManyToMany, JoinColumn, JoinTable } from "typeorm";
import {Post} from "./Post";

@Entity("PostDetails")
export class PostDetails {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    authorName: string;

    @Column()
    comment: string;

    @Column()
    metadata: string;

    @ManyToMany(type => Post, post => post.PostDetails)
    Post: Post[];

}
