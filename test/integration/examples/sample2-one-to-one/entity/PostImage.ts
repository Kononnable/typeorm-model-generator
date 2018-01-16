import { PrimaryGeneratedColumn, Column, Entity, OneToOne, JoinColumn } from "typeorm";
import { Post } from "./Post";

@Entity("PostImage")
export class PostImage {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    url: string;

    @OneToOne(type => Post, post => post.image)
    post: Post;

}
