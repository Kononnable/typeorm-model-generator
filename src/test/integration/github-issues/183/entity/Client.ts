import { PrimaryGeneratedColumn, Entity, ManyToMany, JoinTable } from "typeorm";
import { ClientCategory } from "./ClientCategory";

@Entity("Client")
export class Client {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToMany(
        () => ClientCategory,
        (clientCategory: ClientCategory) => clientCategory.clients
    )
    @JoinTable({
        name: "client_categories",
        joinColumn: { name: "client_id" },
        inverseJoinColumn: { name: "category_id" }
    })
    clientCategories: ClientCategory[];
}
