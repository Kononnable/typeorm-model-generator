import {
    Index,
    Entity,
    PrimaryColumn,
    Column,
    OneToOne,
    OneToMany,
    ManyToOne,
    JoinColumn
} from "typeorm";

@Entity("Post")
export class Post {
    @Column("integer", {
        primary: true,
        name: "id"
    })
    id: number;

    @Column({ comment: "comment" })
    body: string;
}
