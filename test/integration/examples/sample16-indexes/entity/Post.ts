import { Column, Entity, Index, PrimaryGeneratedColumn } from  "typeorm"

@Entity("Post")
@Index("my_index_with_id_and_text", ["id", "text"])
@Index("my_index_with_id_and_title", (post: Post) => [post.id, post.title])
export class Post {

    @PrimaryGeneratedColumn()
    id: number;

    @Index()
    @Column()
    extra: string;

    @Column()
    @Index()
    title: string;

    @Column({ unique: true })
    text: string;

    @Column()
    @Index()
    likesCount: number;

}