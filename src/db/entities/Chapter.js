import {EntitySchema} from "typeorm";

export const Chapter = new EntitySchema({
    name: 'Chapter',
    schema: 'math_values',
    tableName: 'chapters',
    columns: {
        chapter: { type: 'varchar', length: 50, primary: true },
        title:   { type: 'jsonb' }
    },
    relations: {
        slugs: { target: 'Slug', type: 'one-to-many', inverseSide: 'chapter_rel' }
    }
});