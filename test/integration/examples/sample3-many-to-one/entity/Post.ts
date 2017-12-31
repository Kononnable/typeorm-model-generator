import { PrimaryGeneratedColumn, Column, Entity, OneToOne, OneToMany, ManyToOne, JoinColumn } from "typeorm";
import { PostDetails } from "./PostDetails";
import { PostCategory } from "./PostCategory";
import { PostAuthor } from "./PostAuthor";
import { PostInformation } from "./PostInformation";
import { PostImage } from "./PostImage";
import { PostMetadata } from "./PostMetadata";

@Entity("Post")
export class Post {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    title: string;

    @Column()
    text: string;

    // post has relation with category, however inverse relation is not set (category does not have relation with post set)
    @ManyToOne(type => PostCategory, {
        cascade: true,
        onDelete: 'CASCADE'
    })
    category: PostCategory;

    // post has relation with details. cascade inserts here means if new PostDetails instance will be set to this
    // relation it will be inserted automatically to the db when you save this Post entity
    @ManyToOne(type => PostDetails, details => details.posts, {
        cascade: true,
    })
    details: PostDetails;

    // post has relation with details. cascade update here means if new PostDetail instance will be set to this relation
    // it will be inserted automatically to the db when you save this Post entity
    @ManyToOne(type => PostImage, image => image.posts, {
        cascade: true,
    })
    image: PostImage;

    // post has relation with details. cascade update here means if new PostDetail instance will be set to this relation
    // it will be inserted automatically to the db when you save this Post entity
    @ManyToOne(type => PostMetadata, metadata => metadata.posts, {
        cascade: true,
    })
    metadata: PostMetadata | null;

    // post has relation with details. full cascades here
    @ManyToOne(type => PostInformation, information => information.posts, {
        cascade: true,
        onDelete: 'CASCADE'
    })
    information: PostInformation;

    // post has relation with details. not cascades here. means cannot be persisted, updated or removed
    @ManyToOne(type => PostAuthor, author => author.posts)
    author: PostAuthor;

}
