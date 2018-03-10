import * as MariaDb from 'mysql';
import {AbstractDriver} from './AbstractDriver';
import {ColumnInfo} from './../models/ColumnInfo';
import {EntityInfo} from './../models/EntityInfo';
import {RelationInfo} from './../models/RelationInfo';
import {DatabaseModel} from './../models/DatabaseModel';
import {MysqlDriver} from './MysqlDriver';

export class MariaDbDriver extends MysqlDriver {
    readonly EngineName: string = 'MariaDb';
}
