import * as path from "path";
import * as fs from "fs-extra";
import * as chai from "chai";
import * as chaiSubset from "chai-subset";
import { Entity } from "../../src/models/Entity";
import modelCustomizationPhase from "../../src/ModelCustomization";
import { getDefaultGenerationOptions } from "../../src/IGenerationOptions";
import modelGenerationPhase from "../../src/ModelGeneration";
import { getDefaultConnectionOptions } from "../../src/IConnectionOptions";
import { compileGeneratedModel } from "../integration/runTestsFromPath.test";

chai.use(chaiSubset);
const { expect } = chai;

// TODO: test for connectionOptions.specyficTables
describe("Model customization phase", async () => {
    const generateSampleData: () => Entity[] = () => [
        {
            columns: [
                {
                    generated: true,
                    type: "integer",
                    options: { name: "id" },
                    tscName: "id",
                    tscType: "number",
                    primary: true
                },
                {
                    type: "character varying",
                    options: { name: "name" },
                    tscName: "name",
                    tscType: "string"
                },
                {
                    type: "character varying",
                    options: { name: "complicatedName" },
                    tscName: "complexName",
                    tscType: "string"
                }
            ],
            indices: [
                {
                    columns: ["id"],
                    options: { unique: true },
                    name: "PK_6571d08cfb2f1ab06c3aab425a6",
                    primary: true
                }
            ],
            relations: [
                {
                    fieldName: "Post",
                    relatedField: "authorId",
                    relatedTable: "Post",
                    relationType: "OneToMany"
                }
            ],
            relationIds: [],
            sqlName: "PostAuthor",
            tscName: "PostAuthor",
            fileName: "PostAuthor",
            database: "",
            schema: "public",
            fileImports: []
        },
        {
            columns: [
                {
                    generated: true,
                    type: "integer",
                    options: { name: "id" },
                    tscName: "id",
                    tscType: "number",
                    primary: true
                },
                {
                    type: "character varying",
                    options: { name: "title" },
                    tscName: "title",
                    tscType: "string"
                },
                {
                    type: "character varying",
                    options: { name: "text" },
                    tscName: "text",
                    tscType: "string"
                }
            ],
            indices: [
                {
                    columns: ["authorId"],
                    options: { unique: true },
                    name: "REL_cef8d6e8edb69c82e5f10bb402"
                },
                {
                    columns: ["id"],
                    options: { unique: true },
                    name: "PK_c4d3b3dcd73db0b0129ea829f9f",
                    primary: true
                }
            ],
            relations: [
                {
                    fieldName: "authorId",
                    relatedField: "Post",
                    joinColumnOptions: [
                        { name: "authorId", referencedColumnName: "id" }
                    ],
                    relatedTable: "PostAuthor",
                    relationType: "ManyToOne"
                }
            ],
            relationIds: [],
            sqlName: "Post",
            tscName: "Post",
            fileName: "Post",
            database: "",
            schema: "public",
            fileImports: []
        }
    ];

    const resultsPath = path.resolve(process.cwd(), `output`);
    const generateGenerationOptions = () => {
        const generationOptions = getDefaultGenerationOptions();
        generationOptions.resultsPath = resultsPath;
        return generationOptions;
    };
    const clearGenerationDir = () => {
        fs.ensureDirSync(resultsPath);
        fs.emptyDirSync(resultsPath);
    };
    describe("case-file", () => {
        it("PascalCase", () => {
            const data = generateSampleData();
            const generationOptions = generateGenerationOptions();
            clearGenerationDir();

            generationOptions.convertCaseFile = "pascal";
            const customizedModel = modelCustomizationPhase(
                data,
                generationOptions,
                {}
            );
            modelGenerationPhase(
                getDefaultConnectionOptions(),
                generationOptions,
                customizedModel
            );
            const filesGenPath = path.resolve(resultsPath, "entities");
            const files = fs.readdirSync(filesGenPath).sort();
            expect(files[0]).to.equal("Post.ts");
            expect(files[1]).to.equal("PostAuthor.ts");
            compileGeneratedModel(generationOptions.resultsPath, [""]);
        });
        it("camelCase", () => {
            const data = generateSampleData();
            const generationOptions = generateGenerationOptions();
            clearGenerationDir();

            generationOptions.convertCaseFile = "camel";
            const customizedModel = modelCustomizationPhase(
                data,
                generationOptions,
                {}
            );
            modelGenerationPhase(
                getDefaultConnectionOptions(),
                generationOptions,
                customizedModel
            );
            const filesGenPath = path.resolve(resultsPath, "entities");
            const files = fs.readdirSync(filesGenPath).sort();
            expect(files[0]).to.equal("post.ts");
            expect(files[1]).to.equal("postAuthor.ts");
            compileGeneratedModel(generationOptions.resultsPath, [""]);
        });
    });
    describe("case-entity", () => {
        it("PascalCase", () => {
            const data = generateSampleData();
            const generationOptions = generateGenerationOptions();
            clearGenerationDir();

            generationOptions.convertCaseEntity = "pascal";
            const customizedModel = modelCustomizationPhase(
                data,
                generationOptions,
                {}
            );
            modelGenerationPhase(
                getDefaultConnectionOptions(),
                generationOptions,
                customizedModel
            );
            const filesGenPath = path.resolve(resultsPath, "entities");
            const postContent = fs
                .readFileSync(path.resolve(filesGenPath, "Post.ts"))
                .toString();
            const postAuthorContent = fs
                .readFileSync(path.resolve(filesGenPath, "PostAuthor.ts"))
                .toString();
            expect(postContent).to.contain("class Post {");
            expect(postAuthorContent).to.contain("class PostAuthor {");

            compileGeneratedModel(generationOptions.resultsPath, [""]);
        });
        it("camelCase", () => {
            const data = generateSampleData();
            const generationOptions = generateGenerationOptions();
            clearGenerationDir();

            generationOptions.convertCaseEntity = "camel";
            const customizedModel = modelCustomizationPhase(
                data,
                generationOptions,
                {}
            );
            modelGenerationPhase(
                getDefaultConnectionOptions(),
                generationOptions,
                customizedModel
            );
            const filesGenPath = path.resolve(resultsPath, "entities");
            const postContent = fs
                .readFileSync(path.resolve(filesGenPath, "Post.ts"))
                .toString();
            const postAuthorContent = fs
                .readFileSync(path.resolve(filesGenPath, "PostAuthor.ts"))
                .toString();
            expect(postContent).to.contain("class post {");
            expect(postAuthorContent).to.contain("class postAuthor {");

            compileGeneratedModel(generationOptions.resultsPath, [""], false);
        });
    });
    describe("case-property", async () => {
        it("PascalCase", () => {
            const data = generateSampleData();
            const generationOptions = generateGenerationOptions();
            clearGenerationDir();

            generationOptions.convertCaseProperty = "pascal";
            const customizedModel = modelCustomizationPhase(
                data,
                generationOptions,
                {}
            );
            modelGenerationPhase(
                getDefaultConnectionOptions(),
                generationOptions,
                customizedModel
            );
            const filesGenPath = path.resolve(resultsPath, "entities");
            const postContent = fs
                .readFileSync(path.resolve(filesGenPath, "Post.ts"))
                .toString();
            const postAuthorContent = fs
                .readFileSync(path.resolve(filesGenPath, "PostAuthor.ts"))
                .toString();
            expect(postContent).to.contain("Title: string;");
            expect(postAuthorContent).to.contain("Posts: Post[];");
            expect(postAuthorContent).to.contain("ComplexName: string;");

            compileGeneratedModel(generationOptions.resultsPath, [""], false);
        });
        it("camelCase", () => {
            const data = generateSampleData();
            const generationOptions = generateGenerationOptions();
            clearGenerationDir();

            generationOptions.convertCaseProperty = "camel";
            const customizedModel = modelCustomizationPhase(
                data,
                generationOptions,
                {}
            );
            modelGenerationPhase(
                getDefaultConnectionOptions(),
                generationOptions,
                customizedModel
            );
            const filesGenPath = path.resolve(resultsPath, "entities");
            const postContent = fs
                .readFileSync(path.resolve(filesGenPath, "Post.ts"))
                .toString();
            const postAuthorContent = fs
                .readFileSync(path.resolve(filesGenPath, "PostAuthor.ts"))
                .toString();
            expect(postContent).to.contain("title: string;");
            expect(postAuthorContent).to.contain("posts: Post[];");
            expect(postAuthorContent).to.contain("complexName: string;");

            compileGeneratedModel(generationOptions.resultsPath, [""]);
        });
        it("snake_case", () => {
            const data = generateSampleData();
            const generationOptions = generateGenerationOptions();
            clearGenerationDir();

            generationOptions.convertCaseProperty = "snake";
            const customizedModel = modelCustomizationPhase(
                data,
                generationOptions,
                {}
            );
            modelGenerationPhase(
                getDefaultConnectionOptions(),
                generationOptions,
                customizedModel
            );
            const filesGenPath = path.resolve(resultsPath, "entities");
            const postContent = fs
                .readFileSync(path.resolve(filesGenPath, "Post.ts"))
                .toString();
            const postAuthorContent = fs
                .readFileSync(path.resolve(filesGenPath, "PostAuthor.ts"))
                .toString();
            expect(postContent).to.contain("title: string;");
            expect(postAuthorContent).to.contain("posts: Post[];");
            expect(postAuthorContent).to.contain("complex_name: string;");

            compileGeneratedModel(generationOptions.resultsPath, [""],false);
        });
    });
    describe("EOL", async () => {
        it("LF", () => {
            const data = generateSampleData();
            const generationOptions = generateGenerationOptions();
            clearGenerationDir();
            generationOptions.convertEol = "LF";
            const customizedModel = modelCustomizationPhase(
                data,
                generationOptions,
                {}
            );
            modelGenerationPhase(
                getDefaultConnectionOptions(),
                generationOptions,
                customizedModel
            );
            const filesGenPath = path.resolve(resultsPath, "entities");
            const postContent = fs
                .readFileSync(path.resolve(filesGenPath, "Post.ts"))
                .toString();
            expect(postContent).to.not.contain("\r\n");
            expect(postContent).to.contain("\n");
            compileGeneratedModel(generationOptions.resultsPath, [""]);
        });
        it("CRLF", () => {
            const data = generateSampleData();
            const generationOptions = generateGenerationOptions();
            clearGenerationDir();
            generationOptions.convertEol = "CRLF";
            const customizedModel = modelCustomizationPhase(
                data,
                generationOptions,
                {}
            );
            modelGenerationPhase(
                getDefaultConnectionOptions(),
                generationOptions,
                customizedModel
            );
            const filesGenPath = path.resolve(resultsPath, "entities");
            const postContent = fs
                .readFileSync(path.resolve(filesGenPath, "Post.ts"))
                .toString();
            expect(postContent).to.contain("\r\n");
            compileGeneratedModel(generationOptions.resultsPath, [""]);
        });
    });
    describe("property-visibility", () => {
        it("public", () => {
            const data = generateSampleData();
            const generationOptions = generateGenerationOptions();
            clearGenerationDir();

            generationOptions.propertyVisibility = "public";
            const customizedModel = modelCustomizationPhase(
                data,
                generationOptions,
                {}
            );
            modelGenerationPhase(
                getDefaultConnectionOptions(),
                generationOptions,
                customizedModel
            );
            const filesGenPath = path.resolve(resultsPath, "entities");
            const postContent = fs
                .readFileSync(path.resolve(filesGenPath, "Post.ts"))
                .toString();
            const postAuthorContent = fs
                .readFileSync(path.resolve(filesGenPath, "PostAuthor.ts"))
                .toString();
            expect(postContent).to.have.string("  public title: string");
            expect(postAuthorContent).to.have.string("  public posts: Post[];");

            compileGeneratedModel(generationOptions.resultsPath, [""]);
        });
        it("none", () => {
            const data = generateSampleData();
            const generationOptions = generateGenerationOptions();
            clearGenerationDir();

            generationOptions.propertyVisibility = "none";
            const customizedModel = modelCustomizationPhase(
                data,
                generationOptions,
                {}
            );
            modelGenerationPhase(
                getDefaultConnectionOptions(),
                generationOptions,
                customizedModel
            );
            const filesGenPath = path.resolve(resultsPath, "entities");
            const postContent = fs
                .readFileSync(path.resolve(filesGenPath, "Post.ts"))
                .toString();
            const postAuthorContent = fs
                .readFileSync(path.resolve(filesGenPath, "PostAuthor.ts"))
                .toString();
            expect(postContent).to.have.string("  title: string");
            expect(postAuthorContent).to.have.string("  posts: Post[];");

            compileGeneratedModel(generationOptions.resultsPath, [""]);
        });
    });
    it("lazy", async () => {
        const data = generateSampleData();
        const generationOptions = generateGenerationOptions();
        clearGenerationDir();

        generationOptions.lazy = true;
        generationOptions.pluralizeNames = false;
        const customizedModel = modelCustomizationPhase(
            data,
            generationOptions,
            {}
        );
        modelGenerationPhase(
            getDefaultConnectionOptions(),
            generationOptions,
            customizedModel
        );
        const filesGenPath = path.resolve(resultsPath, "entities");
        const postContent = fs
            .readFileSync(path.resolve(filesGenPath, "Post.ts"))
            .toString();
        const postAuthorContent = fs
            .readFileSync(path.resolve(filesGenPath, "PostAuthor.ts"))
            .toString();
        expect(postContent).to.have.string("lazy: true");
        expect(postContent).to.have.string("Promise<PostAuthor>;");
        expect(postAuthorContent).to.have.string("lazy: true");
        expect(postAuthorContent).to.have.string("Promise<Post[]>");

        compileGeneratedModel(generationOptions.resultsPath, [""]);
    });
    it("activeRecord", async () => {
        const data = generateSampleData();
        const generationOptions = generateGenerationOptions();
        clearGenerationDir();

        generationOptions.activeRecord = true;
        const customizedModel = modelCustomizationPhase(
            data,
            generationOptions,
            {}
        );
        modelGenerationPhase(
            getDefaultConnectionOptions(),
            generationOptions,
            customizedModel
        );
        const filesGenPath = path.resolve(resultsPath, "entities");
        const postContent = fs
            .readFileSync(path.resolve(filesGenPath, "Post.ts"))
            .toString();
        const postAuthorContent = fs
            .readFileSync(path.resolve(filesGenPath, "PostAuthor.ts"))
            .toString();
        expect(postContent).to.have.string(
            `export class Post extends BaseEntity `
        );
        expect(postAuthorContent).to.have.string(
            `export class PostAuthor extends BaseEntity `
        );

        compileGeneratedModel(generationOptions.resultsPath, [""]);
    });
    it("skipSchema", async () => {
        const data = generateSampleData();
        const generationOptions = generateGenerationOptions();
        clearGenerationDir();

        generationOptions.skipSchema = true;
        const customizedModel = modelCustomizationPhase(
            data,
            generationOptions,
            {}
        );
        modelGenerationPhase(
            getDefaultConnectionOptions(),
            generationOptions,
            customizedModel
        );
        const filesGenPath = path.resolve(resultsPath, "entities");
        const postContent = fs
            .readFileSync(path.resolve(filesGenPath, "Post.ts"))
            .toString();
        const postAuthorContent = fs
            .readFileSync(path.resolve(filesGenPath, "PostAuthor.ts"))
            .toString();
        expect(postContent).to.have.string(`@Entity("Post")`);
        expect(postAuthorContent).to.have.string(`@Entity("PostAuthor")`);

        compileGeneratedModel(generationOptions.resultsPath, [""]);
    });
    it("generateConstructor", async () => {
        const data = generateSampleData();
        const generationOptions = generateGenerationOptions();
        clearGenerationDir();

        generationOptions.generateConstructor = true;
        const customizedModel = modelCustomizationPhase(
            data,
            generationOptions,
            {}
        );
        modelGenerationPhase(
            getDefaultConnectionOptions(),
            generationOptions,
            customizedModel
        );
        const filesGenPath = path.resolve(resultsPath, "entities");
        const postContent = fs
            .readFileSync(path.resolve(filesGenPath, "Post.ts"))
            .toString();
        const postAuthorContent = fs
            .readFileSync(path.resolve(filesGenPath, "PostAuthor.ts"))
            .toString();
        expect(postContent).to.have.string(`constructor(init?: Partial<Post>)`);
        expect(postContent).to.have.string(`Object.assign(this, init);`);
        expect(postAuthorContent).to.have.string(
            `constructor(init?: Partial<PostAuthor>)`
        );
        expect(postAuthorContent).to.have.string(`Object.assign(this, init);`);

        compileGeneratedModel(generationOptions.resultsPath, [""]);
    });
    it("generateConstructor with activeRecord", async () => {
        const data = generateSampleData();
        const generationOptions = generateGenerationOptions();
        clearGenerationDir();

        generationOptions.generateConstructor = true;
        generationOptions.activeRecord = true;
        const customizedModel = modelCustomizationPhase(
            data,
            generationOptions,
            {}
        );
        modelGenerationPhase(
            getDefaultConnectionOptions(),
            generationOptions,
            customizedModel
        );
        const filesGenPath = path.resolve(resultsPath, "entities");
        const postContent = fs
            .readFileSync(path.resolve(filesGenPath, "Post.ts"))
            .toString();
        const postAuthorContent = fs
            .readFileSync(path.resolve(filesGenPath, "PostAuthor.ts"))
            .toString();
        expect(postContent).to.have.string(`constructor(init?: Partial<Post>)`);
        expect(postContent).to.have.string(`super();`);
        expect(postContent).to.have.string(`Object.assign(this, init);`);
        expect(postAuthorContent).to.have.string(
            `constructor(init?: Partial<PostAuthor>)`
        );
        expect(postAuthorContent).to.have.string(`super();`);
        expect(postAuthorContent).to.have.string(`Object.assign(this, init);`);

        compileGeneratedModel(generationOptions.resultsPath, [""]);
    });
    describe("strictMode", () => {
        it("!", async () => {
            const data = generateSampleData();
            const generationOptions = generateGenerationOptions();
            clearGenerationDir();

            generationOptions.strictMode = "!";
            const customizedModel = modelCustomizationPhase(
                data,
                generationOptions,
                {}
            );
            modelGenerationPhase(
                getDefaultConnectionOptions(),
                generationOptions,
                customizedModel
            );
            const filesGenPath = path.resolve(resultsPath, "entities");
            const postContent = fs
                .readFileSync(path.resolve(filesGenPath, "Post.ts"))
                .toString();
            const postAuthorContent = fs
                .readFileSync(path.resolve(filesGenPath, "PostAuthor.ts"))
                .toString();
            expect(postContent).to.have.string(`id!: number;`);
            expect(postContent).to.have.string(`title!: string;`);
            expect(postContent).to.have.string(`text!: string;`);
            expect(postContent).to.have.string(`author!: PostAuthor;`);
            expect(postAuthorContent).to.have.string(`id!: number;`);
            expect(postAuthorContent).to.have.string(`name!: string;`);
            expect(postAuthorContent).to.have.string(`posts!: Post[];`);

            compileGeneratedModel(generationOptions.resultsPath, [""]);
        });
        it("?", async () => {
            const data = generateSampleData();
            const generationOptions = generateGenerationOptions();
            clearGenerationDir();

            generationOptions.strictMode = "?";
            const customizedModel = modelCustomizationPhase(
                data,
                generationOptions,
                {}
            );
            modelGenerationPhase(
                getDefaultConnectionOptions(),
                generationOptions,
                customizedModel
            );
            const filesGenPath = path.resolve(resultsPath, "entities");
            const postContent = fs
                .readFileSync(path.resolve(filesGenPath, "Post.ts"))
                .toString();
            const postAuthorContent = fs
                .readFileSync(path.resolve(filesGenPath, "PostAuthor.ts"))
                .toString();
            expect(postContent).to.have.string(`id?: number;`);
            expect(postContent).to.have.string(`title?: string;`);
            expect(postContent).to.have.string(`text?: string;`);
            expect(postContent).to.have.string(`author?: PostAuthor;`);
            expect(postAuthorContent).to.have.string(`id?: number;`);
            expect(postAuthorContent).to.have.string(`name?: string;`);
            expect(postAuthorContent).to.have.string(`posts?: Post[];`);

            compileGeneratedModel(generationOptions.resultsPath, [""]);
        });
    });
    it("naming strategy", async () => {
        const data = generateSampleData();
        const generationOptions = generateGenerationOptions();
        clearGenerationDir();
        generationOptions.convertCaseEntity = "none";
        generationOptions.convertCaseFile = "none";
        generationOptions.convertCaseProperty = "none";
        generationOptions.customNamingStrategyPath =
            "test/modelCustomization/testNamingStrategy.ts";
        // TODO: relationId

        const customizedModel = modelCustomizationPhase(
            data,
            generationOptions,
            {}
        );
        modelGenerationPhase(
            getDefaultConnectionOptions(),
            generationOptions,
            customizedModel
        );
        const filesGenPath = path.resolve(resultsPath, "entities");
        const postContent = fs
            .readFileSync(path.resolve(filesGenPath, "Post_B_D.ts"))
            .toString();
        const postAuthorContent = fs
            .readFileSync(path.resolve(filesGenPath, "PostAuthor_B_D.ts"))
            .toString();
        expect(postContent).to.have.string(`@Entity("Post"`);
        expect(postContent).to.have.string(`class Post_B {`);
        expect(postContent).to.have.string(`id_C: number;`);
        expect(postContent).to.have.string(`author_A: PostAuthor_B`);
        expect(postContent).to.have.string(
            `import { PostAuthor_B } from "./PostAuthor_B_D";`
        );
        expect(postAuthorContent).to.have.string(`@Entity("PostAuthor"`);
        expect(postAuthorContent).to.have.string(`class PostAuthor_B`);
        expect(postAuthorContent).to.have.string(`id_C: number;`);
        expect(postAuthorContent).to.have.string(
            `import { Post_B } from "./Post_B_D";`
        );

        compileGeneratedModel(generationOptions.resultsPath, [""], false);
    });
    describe("pluralization", () => {
        it("enabled", async () => {
            const data = generateSampleData();
            const generationOptions = generateGenerationOptions();
            generationOptions.pluralizeNames = true;
            clearGenerationDir();

            const customizedModel = modelCustomizationPhase(
                data,
                generationOptions,
                {}
            );
            modelGenerationPhase(
                getDefaultConnectionOptions(),
                generationOptions,
                customizedModel
            );
            const filesGenPath = path.resolve(resultsPath, "entities");
            const postAuthorContent = fs
                .readFileSync(path.resolve(filesGenPath, "PostAuthor.ts"))
                .toString();
            expect(postAuthorContent).to.contain("posts: Post[];");
            compileGeneratedModel(generationOptions.resultsPath, [""]);
        });
        it("disabled", async () => {
            const data = generateSampleData();
            const generationOptions = generateGenerationOptions();
            generationOptions.pluralizeNames = false;
            clearGenerationDir();

            const customizedModel = modelCustomizationPhase(
                data,
                generationOptions,
                {}
            );
            modelGenerationPhase(
                getDefaultConnectionOptions(),
                generationOptions,
                customizedModel
            );
            const filesGenPath = path.resolve(resultsPath, "entities");
            const postAuthorContent = fs
                .readFileSync(path.resolve(filesGenPath, "PostAuthor.ts"))
                .toString();
            expect(postAuthorContent).to.contain("post: Post[];");
            compileGeneratedModel(generationOptions.resultsPath, [""]);
        });
    });
    describe("index file generation", () => {
        it("named export", async () => {
            const data = generateSampleData();
            const generationOptions = generateGenerationOptions();
            generationOptions.indexFile = true;
            clearGenerationDir();

            const customizedModel = modelCustomizationPhase(
                data,
                generationOptions,
                {}
            );
            modelGenerationPhase(
                getDefaultConnectionOptions(),
                generationOptions,
                customizedModel
            );
            const filesGenPath = path.resolve(resultsPath, "entities");
            const indexFileContent = fs
                .readFileSync(path.resolve(filesGenPath, "Index.ts"))
                .toString();
            expect(indexFileContent).to.contain(
                'import { PostAuthor } from "./PostAuthor'
            );
            expect(indexFileContent).to.contain('import { Post } from "./Post');
            expect(indexFileContent).to.contain("export { PostAuthor, Post }");
            compileGeneratedModel(generationOptions.resultsPath, [""]);
        });
        it("default export", async () => {
            const data = generateSampleData();
            const generationOptions = generateGenerationOptions();
            generationOptions.indexFile = true;
            generationOptions.exportType = "default";
            clearGenerationDir();

            const customizedModel = modelCustomizationPhase(
                data,
                generationOptions,
                {}
            );
            modelGenerationPhase(
                getDefaultConnectionOptions(),
                generationOptions,
                customizedModel
            );
            const filesGenPath = path.resolve(resultsPath, "entities");
            const indexFileContent = fs
                .readFileSync(path.resolve(filesGenPath, "Index.ts"))
                .toString();
            expect(indexFileContent).to.contain(
                'import PostAuthor from "./PostAuthor'
            );
            expect(indexFileContent).to.contain('import Post from "./Post');
            expect(indexFileContent).to.contain("export { PostAuthor, Post }");
            compileGeneratedModel(generationOptions.resultsPath, [""]);
        });
        it("disabled", async () => {
            const data = generateSampleData();
            const generationOptions = generateGenerationOptions();
            generationOptions.pluralizeNames = false;
            clearGenerationDir();

            const customizedModel = modelCustomizationPhase(
                data,
                generationOptions,
                {}
            );
            modelGenerationPhase(
                getDefaultConnectionOptions(),
                generationOptions,
                customizedModel
            );
            const filesGenPath = path.resolve(resultsPath, "entities");
            expect(
                fs.existsSync(path.resolve(filesGenPath, "Index.ts"))
            ).to.equal(false);
            compileGeneratedModel(generationOptions.resultsPath, [""]);
        });
    });
});
