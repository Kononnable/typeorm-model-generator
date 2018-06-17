import { Column, Entity, Index, PrimaryGeneratedColumn, VersionColumn, ManyToMany } from "typeorm"
import {Post} from "./Post";

@Entity("Category")
export class Category {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @ManyToMany(type => Post, post => post.categorys)
    posts: Promise<Post[]>;

}
