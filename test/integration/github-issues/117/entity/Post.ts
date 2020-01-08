import {
    Index,
    Entity,
    PrimaryColumn,
    Column,
    OneToOne,
    OneToMany,
    ManyToOne,
    ManyToMany,
    JoinColumn,
    JoinTable
} from "typeorm";
import { Section } from "./Section";

@Entity("Post")
export class Post {
    @Column("int", {
        primary: true,
        name: "Id"
    })
    id: number;

    @OneToOne(type => Section, section => section.post)
    @JoinColumn([
        { name: "work", referencedColumnName: "work" },
        { name: "section", referencedColumnName: "section" }
    ])
    section: Section;
}
