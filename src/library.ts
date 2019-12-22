import { Column as ColumnModel } from "./models/Column";
import { Entity as EntityModel } from "./models/Entity";
import { Index as IndexModel } from "./models/Index";
import { Relation as RelationModel } from "./models/Relation";
import { RelationId as RelationIdModel } from "./models/RelationId";

// models exports - there may be a more succinct way to export default classes,
// but this was the only one I could find that seemed happy
export type Column = ColumnModel;
export type Entity = EntityModel;
export type Index = IndexModel;
export type Relation = RelationModel;
export type RelationId = RelationIdModel;

export * from "./Engine";
export * from "./IConnectionOptions";
export * from "./IGenerationOptions";
export * from "./NamingStrategy";
export * from "./Utils";
