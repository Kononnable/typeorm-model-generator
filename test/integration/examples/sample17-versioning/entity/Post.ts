import { Column, Entity, Index, PrimaryGeneratedColumn, VersionColumn } from "typeorm"

@Entity("Post")
export class Post {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    title: string;

    @Column()
    text: string;

    @VersionColumn()
    version: number;

}
