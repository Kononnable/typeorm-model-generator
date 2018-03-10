import {EntityInfo} from './EntityInfo';

export class DatabaseModel {
    entities: EntityInfo[];
    config: {
        cascadeInsert: boolean;
        cascadeUpdate: boolean;
        cascadeRemove: boolean;
    };
}
