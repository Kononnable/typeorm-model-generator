import { PrimaryGeneratedColumn, Column, Entity, OneToOne, OneToMany, ManyToOne, JoinColumn } from "typeorm";

@Entity("PostCategory")
export class PostCategory {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

}
