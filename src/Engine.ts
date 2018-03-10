import fs = require('fs');
import path = require('path');
import changeCase = require('change-case');
import {BaseEntity} from 'typeorm';
import {AbstractDriver} from './drivers/AbstractDriver';
import {DatabaseModel} from './models/DatabaseModel';
import {EntityInfo} from './models/EntityInfo';

const BaseEntityProps = Object.getOwnPropertyNames(BaseEntity.prototype);

export interface EngineOptions {
    host: string;
    port: number;
    databaseName: string;
    user: string;
    password: string;
    resultsPath: string;
    databaseType: string;
    schemaName: string;
    ssl: boolean;
    indent: 'tab' | number;
    validator: boolean;
    convertCaseFile: 'pascal' | 'param' | 'camel' | 'none';
    convertCaseEntity: 'pascal' | 'camel' | 'none';
    convertCaseProperty: 'pascal' | 'camel' | 'none';
}

export class Engine {
    constructor(
        private driver: AbstractDriver,
        public Options: EngineOptions) {
    }

    private typeormImports = {};
    private validateImports = {};

    public async createModelFromDatabase(): Promise<EntityInfo[]> {
        const database = await this.driver.GetDataFromServer(
            this.Options.databaseName,
            this.Options.host,
            this.Options.port,
            this.Options.user,
            this.Options.password,
            this.Options.schemaName,
            this.Options.ssl
        );

        if (database.entities.length > 0) {
            const resultPath = this.Options.resultsPath;
            if (!fs.existsSync(resultPath)) {
                fs.mkdirSync(resultPath);
            }

            const entitiesPath = path.resolve(resultPath, './entities');
            if (!fs.existsSync(entitiesPath)) {
                fs.mkdirSync(entitiesPath);
            }

            database.entities.forEach(this.writeModel.bind(this));
            return database.entities;
        }

        return [];
    }

    private writeModel(data) {
        data.Imports = [];
        data.Columns.forEach(column => {
            column.relations.forEach(relation => {
                if (data.EntityName !== relation.relatedTable) {
                    data.Imports.push(relation.relatedTable);
                }
            });
        });
        data.Imports.filter((e, i, s) => i === s.indexOf(e));

        const fileName = this.convertCase(data.EntityName, this.Options.convertCaseFile);
        const filePath = path.resolve(this.Options.resultsPath, `./entities/${fileName}.ts`);
        const fileContents = this.serializeEntity(data);
        fs.writeFileSync(filePath, fileContents, {encoding: 'UTF-8', flag: 'w'});
    }

    private serializeEntity(entity) {
        this.typeormImports = {BaseEntity: true, Entity: true};
        this.validateImports = {};
        entity.relationImports();

        const tableName = entity.EntityName;
        const className = this.convertCase(tableName, this.Options.convertCaseEntity);
        const eol = this.getEOL();
        let content = '';

        content += this.flatten(entity.UniqueImports, this.serializeEntityImports);
        content += `${eol}@Entity('${tableName}')${eol}`;
        content += this.flatten(entity.Indexes, this.serializeIndexes);
        content += `export class ${className} extends BaseEntity {${eol}${eol}`;
        content += this.flatten(entity.Columns, this.serializeColumn);
        content += `}${eol}`;

        return `${this.serializeImports()}${content}`;
    }

    private serializeImports() {
        const ormClasses = Object.keys(this.typeormImports).join(', ');
        const validateClasses = Object.keys(this.validateImports).join(', ');
        const eol = this.getEOL();
        let content = `import {${ormClasses}} from 'typeorm';${eol}`;
        if (this.Options.validator)
            content += `import {${validateClasses}} from 'class-validator';${eol}`;
        return content;
    }

    private serializeEntityImports(name: string) {
        const className = this.convertCase(name, this.Options.convertCaseEntity);
        const fileName = this.convertCase(name, this.Options.convertCaseFile);
        return `import {${className}} from './${fileName}';${this.getEOL()}`;
    }

    private serializeIndexes(index) {
        if (index.isPrimaryKey) return null;
        const tab = this.getTab();
        const eol = this.getEOL();
        const columns = index.columns.map(c => `'${c.name}'`).join(', ');
        const props = this.serializeProps({
            unique: index.isUnique ? true : undefined
        });

        this.typeormImports['Index'] = true;
        return `@Index([${columns}]${props ? ', ' + props : ''})${eol}`;
    }

    private serializeColumn(column) {
        const {columnType, name, isPrimary, tsType, sqlType, isDefaultType, isNullable, charMaxLength, enumOptions, numericScale, numericPrecision} = column;
        const propName = this.propCase(name);
        const options = this.serializeProps({
            type: !isDefaultType ? sqlType : undefined,
            length: charMaxLength ? charMaxLength : undefined,
            enum: enumOptions ? enumOptions.split() : undefined,
            precision: numericPrecision ? numericPrecision : undefined,
            scale: numericScale ? numericScale : undefined,
            nullable: isNullable ? isNullable : undefined,
            name: propName !== name && !column.relations.length ? name : undefined
        });

        const tab = this.getTab();
        const eol = this.getEOL();
        const colType = columnType === 'Column' && isPrimary ? 'PrimaryColumn' : columnType;
        const pluralType = sqlType == 'enum' ? `${tsType}[]` : tsType;
        const propType = isNullable ? `?: ${pluralType} | null` : `: ${pluralType}`;
        let contents = `${tab}@${colType}(${options})`;
        if (this.Options.validator)
            contents += this.serializeColumnValidation(column);
        if (!column.relations.length)
            contents += `${eol}${tab}public ${propName}${propType};${eol}${eol}`;
        else
            contents += eol;
        contents += this.flatten(column.relations, c => this.serializeColumnRelation(column, c));

        this.typeormImports[colType] = true;
        return contents;
    }

    private serializeColumnValidation(column) {
        const {name, tsType, sqlType, isNullable, enumOptions} = column;
        const nl = this.getEOL() + this.getTab();
        const validate = {};

        if (isNullable)
            validate['IsOptional'] = null;
        if (name === 'email')
            validate['IsEmail'] = null;
        else if (sqlType === 'enum')
            validate['IsIn'] = `[${enumOptions}]`;
        else if (tsType === 'string')
            validate['IsString'] = null;
        else if (tsType === 'number')
            validate['IsNumber'] = null;

        return Object.keys(validate).map(m => {
            this.validateImports[m] = true;
            return `${nl}@${m}(${validate[m] || ''})`;
        }).join('');
    }

    private serializeColumnRelation(column, relation) {
        const eol = this.getEOL();
        const tab = this.getTab();
        const {relationType, relatedTable, isOwner, ownerColumn, relatedColumn} = relation;
        const decorator = relation.relationType;
        const joinTable = this.convertCase(relatedTable, this.Options.convertCaseEntity);
        const contextProp = isOwner ? ownerColumn : relatedColumn;
        const contextColumn = this.propCase(contextProp);
        const propName = this.propCase(column.name);

        this.typeormImports[decorator] = true;

        let contents = `${tab}@${decorator}(t=>${joinTable}, r=>r.${contextColumn})${eol}`;

        if (relation.isOwner) {
            contents += `${tab}@JoinColumn({name:'${column.name}'})${eol}`;
            this.typeormImports['JoinColumn'] = true;
        }

        contents += `${tab}public ${propName}: ${joinTable}`;
        contents += relation.isOneToMany ? '[];' : ';';
        contents += eol + eol;

        return contents;
    }

    private serializeProps(props) {
        const validProps = Object.keys(props).map(key => {
            const value = props[key];
            if (!value) return false;
            switch (typeof value) {
                case 'string':
                    return `${key}:'${value.replace(/\'/g, '\\\'')}'`;
                case 'object':
                    return Array.isArray(value)
                        ? `${key}:[${value.join()}]`
                        : `${key}:${JSON.stringify(value)}`;
                case 'number':
                default:
                    return `${key}:${value}`;
            }
        }).filter(Boolean);
        return validProps.length ? `{${validProps.join(', ')}}` : '';
    }

    private flatten(entries, method) {
        return entries ? entries.map(method.bind(this)).join('') : '';
    }

    private propCase(str: string) {
        if (BaseEntityProps.indexOf(str) !== -1)
            return this.convertCase(`${str}_attribute`, this.Options.convertCaseProperty);
        return this.convertCase(str, this.Options.convertCaseProperty);
    }

    private convertCase(str: string, caseType: string) {
        switch (caseType) {
            case 'camel':
                return changeCase.camelCase(str);
            case 'param':
                return changeCase.paramCase(str);
            case 'pascal':
                return changeCase.pascalCase(str);
        }
        return str;
    }

    private getTab() {
        const indent = this.Options.indent || 2;
        return indent !== 'tab' ? (' ').repeat(indent) : '\t';
    }

    private getEOL() {
        return '\n';
    }
}
