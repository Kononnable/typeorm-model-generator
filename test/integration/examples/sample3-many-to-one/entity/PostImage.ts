import { PrimaryGeneratedColumn, Column, Entity, OneToOne, OneToMany, ManyToOne, JoinColumn } from "typeorm";
import {Post} from "./Post";

@Entity("PostImage")
export class PostImage {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    url: string;

    @OneToMany(type => Post, post => post.image)
    posts: Post[];

}
