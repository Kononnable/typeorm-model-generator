import { PrimaryGeneratedColumn, Column, Entity, OneToOne, JoinColumn, Index } from "typeorm";
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
    @OneToOne(type => PostCategory, {
        // cascade: true,
        onDelete: 'CASCADE'
    })
    @JoinColumn()
    // @Index({ unique: true })
    category: PostCategory;

    // post has relation with details. cascade inserts here means if new PostDetails instance will be set to this
    // relation it will be inserted automatically to the db when you save this Post entity
    @OneToOne(type => PostDetails, details => details.post, {
         onDelete: 'CASCADE'
         // cascade: true
    })
    @JoinColumn()
    // @Index({ unique: true })
    details: PostDetails;

    // post has relation with details. cascade update here means if new PostDetail instance will be set to this relation
    // it will be inserted automatically to the db when you save this Post entity
    @OneToOne(type => PostImage, image => image.post, {
        // cascade: true,
    })
    @JoinColumn()
    // @Index({ unique: true })
    image: PostImage;

    // post has relation with details. cascade update here means if new PostDetail instance will be set to this relation
    // it will be inserted automatically to the db when you save this Post entity
    @OneToOne(type => PostMetadata, metadata => metadata.post, {
        onDelete: 'CASCADE'
    })
    @JoinColumn()
    // @Index({ unique: true })
    metadata: PostMetadata | null;

    // post has relation with details. full cascades here
    @OneToOne(type => PostInformation, information => information.post, {
        // cascade: true,
         onDelete: 'CASCADE'
    })
    @JoinColumn()
    // @Index({ unique: true })
    information: PostInformation;

    // post has relation with details. not cascades here. means cannot be persisted, updated or removed
    @OneToOne(type => PostAuthor, author => author.post)
    @JoinColumn()
    // @Index({ unique: true })
    author: PostAuthor;

}
