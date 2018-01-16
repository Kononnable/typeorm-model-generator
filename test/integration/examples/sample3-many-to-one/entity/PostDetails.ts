import { PrimaryGeneratedColumn, Column, Entity, OneToOne, OneToMany, ManyToOne, JoinColumn } from "typeorm";
import { Post } from "./Post";

@Entity("PostDetails")
export class PostDetails {

    @PrimaryGeneratedColumn()
    id: number;

    @Column({
        nullable: true
    })
    authorName: string;

    @Column({
        nullable: true
    })
    comment: string;

    @Column({
        nullable: true
    })
    metadata: string;

    @OneToMany(type => Post, post => post.details)
    posts: Post[];

}
