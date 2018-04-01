import { PrimaryGeneratedColumn, Column, Entity, OneToOne, OneToMany, ManyToOne, ManyToMany, JoinColumn, JoinTable } from "typeorm";

@Entity("PostCategory")
export class PostCategory {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

}
