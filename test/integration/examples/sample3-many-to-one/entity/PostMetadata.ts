import { PrimaryGeneratedColumn, Column, Entity, OneToOne, OneToMany, ManyToOne, JoinColumn } from "typeorm";
import { Post } from "./Post";

@Entity("PostMetadata")
export class PostMetadata {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    description: string;

    @OneToMany(type => Post, post => post.metadata)
    posts: Post[];

}
