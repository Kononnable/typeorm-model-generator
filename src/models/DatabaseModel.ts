interface DatabaseModel {
    entities: EntityInfo[],
    config: {
        cascadeInsert: boolean,
        cascadeUpdate: boolean,
        cascadeRemove: boolean,
    }
}