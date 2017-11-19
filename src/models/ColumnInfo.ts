import { RelationInfo } from './RelationInfo'
import { ColumnType } from 'typeorm';
/**
 * ColumnInfo
 */
export class ColumnInfo {
    name: string = '';
    default: string | null = null;
    is_nullable: boolean = false;
    ts_type: 'number' | 'string' | 'boolean' | 'Date' | 'Buffer' | 'any';
    sql_type: ColumnType;
    char_max_lenght: number | null = null;
    isPrimary: boolean = false;
    is_generated: boolean = false;
    numericPrecision: number | null = null;
    numericScale: number | null = null;
    relations: RelationInfo[];


    constructor() {
        this.relations = [];
    }

}


