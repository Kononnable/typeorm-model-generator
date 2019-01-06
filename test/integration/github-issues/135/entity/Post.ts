import { Index, Entity, PrimaryColumn, Column, OneToOne, OneToMany, ManyToOne, ManyToMany, JoinColumn, JoinTable } from "typeorm";
import { PostAuthor } from "./PostAuthor";
import { PostCategory } from "./PostCategory";


@Index("travel_travelplanextra_travel_plan_id_extra_id_f825ca51_uniq",["postAuthor","postCategory",],{unique:true})
@Entity("Post")
export class Post {

    @Column("int", {
        nullable: false,
        primary: true,
        name: "Id"
    })
    Id: number;

    @ManyToOne(type => PostAuthor, PostAuthor => PostAuthor.Id)
    @JoinColumn()
    postAuthor: PostAuthor;


    @ManyToOne(type => PostCategory, PostCategory => PostCategory.Id)
    @JoinColumn()
    postCategory: PostCategory;

}
