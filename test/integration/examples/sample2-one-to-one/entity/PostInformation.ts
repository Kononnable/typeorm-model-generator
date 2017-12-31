import { PrimaryGeneratedColumn, Column, Entity, OneToOne, JoinColumn } from "typeorm";
import { Post } from "./Post";

@Entity("PostInformation")
export class PostInformation {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    text: string;

    @OneToOne(type => Post, post => post.information)
    post: Post;

}
