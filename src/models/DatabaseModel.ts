import {EntityInfo} from './EntityInfo'
export class DatabaseModel {
    entities: EntityInfo[];
    config: {
        cascadeInsert: boolean,
        cascadeUpdate: boolean,
        cascadeRemove: boolean,
    }
    relationImports():any{
        let that=this;
         return function(text, render) {
            if ('l'!=render(text))  return `import {${render(text)}} from "./${render(text)}"`
             else return '';
    }
    }
}