import {
    Column,
    Entity,
    PrimaryGeneratedColumn,
    Index,
    Generated
} from "typeorm";

@Entity("Post")
export class Post {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    title: string;

    @Column()
    text: string;

    @Column("int", {
        // Columns are non-nullable by default
        // nullable: false
    })
    likesCount: number;
}
