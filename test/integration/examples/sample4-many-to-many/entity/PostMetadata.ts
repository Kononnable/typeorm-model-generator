import { PrimaryGeneratedColumn, Column, Entity, OneToOne, OneToMany, ManyToOne, ManyToMany, JoinColumn, JoinTable } from "typeorm";
import {Post} from "./Post";

@Entity("PostMetadata")
export class PostMetadata {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    description: string;

    @ManyToMany(type => Post, post => post.postMetadatas)
    posts: Post[];

}
