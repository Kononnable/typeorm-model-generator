import { PrimaryGeneratedColumn, Column, Entity, OneToOne, OneToMany, ManyToOne, JoinColumn } from "typeorm";
import { Post } from "./Post";

@Entity("PostInformation")
export class PostInformation {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    text: string;

    @OneToMany(type => Post, post => post.information)
    posts: Post[];

}
