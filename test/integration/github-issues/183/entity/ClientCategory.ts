import { Entity, PrimaryGeneratedColumn, ManyToMany } from "typeorm";
import { Client } from "./Client";

@Entity("ClientCategory")
export class ClientCategory {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToMany(() => Client, (client: Client) => client.clientCategories)
    clients: Client[];
}
