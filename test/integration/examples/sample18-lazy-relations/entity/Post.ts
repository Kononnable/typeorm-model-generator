import {
    Column,
    Entity,
    Index,
    PrimaryGeneratedColumn,
    ManyToOne,
    ManyToMany,
    JoinTable
} from "typeorm";
import { Author } from "./Author";
import { Category } from "./Category";

@Entity("Post")
export class Post {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    title: string;

    @Column()
    text: string;

    @ManyToOne(type => Author, author => author.posts, {
        lazy: true,
        // cascade: ["insert"],
        onDelete: "SET NULL"
        // onUpdate: "CASCADE"  - onUpdate not supported on oracledb
    })
    author: Promise<Author | null>;

    @ManyToMany(type => Category, category => category.posts, {
        lazy: true
        // cascade: true
    })
    @JoinTable()
    categories: Promise<Category[]>;
}
