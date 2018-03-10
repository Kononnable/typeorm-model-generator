import {ColumnType} from 'typeorm';
import {RelationInfo} from './RelationInfo';

export class ColumnInfo {
    name: string = '';
    default: string | null = null;
    columnType: string = 'Column';
    isNullable: boolean = false;
    tsType:
        | 'number'
        | 'string'
        | 'boolean'
        | 'Date'
        | 'Buffer'
        | 'Object'
        | 'string | Object'
        | 'string | string[]'
        | 'any';
    sqlType: string;
    charMaxLength: number | null = null;
    isPrimary: boolean = false;
    isGenerated: boolean = false;
    isDefaultType: boolean = false;
    numericPrecision: number | null = null;
    numericScale: number | null = null;
    enumOptions: string | null = null;
    relations: RelationInfo[];

    constructor() {
        this.relations = [];
    }
}
