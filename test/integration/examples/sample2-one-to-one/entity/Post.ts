import {PrimaryGeneratedColumn, Column, Entity, OneToOne,JoinColumn} from "typeorm";
import {PostDetails} from "./PostDetails";
import {PostCategory} from "./PostCategory";
import {PostAuthor} from "./PostAuthor";
import {PostInformation} from "./PostInformation";
import {PostImage} from "./PostImage";
import {PostMetadata} from "./PostMetadata";

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
        cascadeInsert: true,
        cascadeUpdate: true,
        cascadeRemove: true
    })
    @JoinColumn()
    category: PostCategory;

    // post has relation with details. cascade inserts here means if new PostDetails instance will be set to this 
    // relation it will be inserted automatically to the db when you save this Post entity
    @OneToOne(type => PostDetails, details => details.post, {
        cascadeInsert: true
    })
    @JoinColumn()
    details: PostDetails;

    // post has relation with details. cascade update here means if new PostDetail instance will be set to this relation
    // it will be inserted automatically to the db when you save this Post entity
    @OneToOne(type => PostImage, image => image.post, {
        cascadeUpdate: true
    })
    @JoinColumn()
    image: PostImage;

    // post has relation with details. cascade update here means if new PostDetail instance will be set to this relation
    // it will be inserted automatically to the db when you save this Post entity
    @OneToOne(type => PostMetadata, metadata => metadata.post, {
        cascadeRemove: true
    })
    @JoinColumn()
    metadata: PostMetadata|null;

    // post has relation with details. full cascades here
    @OneToOne(type => PostInformation, information => information.post, {
        cascadeInsert: true,
        cascadeUpdate: true,
        cascadeRemove: true
    })
    @JoinColumn()
    information: PostInformation;

    // post has relation with details. not cascades here. means cannot be persisted, updated or removed
    @OneToOne(type => PostAuthor, author => author.post)
    @JoinColumn()
    author: PostAuthor;

}