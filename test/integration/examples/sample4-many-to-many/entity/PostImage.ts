import { PrimaryGeneratedColumn, Column, Entity, OneToOne, OneToMany, ManyToOne, ManyToMany, JoinColumn, JoinTable } from "typeorm";
import {Post} from "./Post";

@Entity("PostImage")
export class PostImage {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    url: string;

    @ManyToMany(type => Post, post => post.postImages)
    posts: Post[];

}
