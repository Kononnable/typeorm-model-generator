import { Column, Entity, PrimaryColumn } from "typeorm";

@Entity("Post")
export class Post {

    @PrimaryColumn("int")
    id: number;

    @PrimaryColumn()
    type: string;

    @Column()
    text: string;

}
