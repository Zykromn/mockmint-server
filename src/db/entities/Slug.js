import {EntitySchema} from "typeorm";

export const Slug = new EntitySchema({
    name: 'Slug',
    schema: 'math_values',
    tableName: 'slugs',
    columns: {
        slug:    { type: 'varchar', length: 100, primary: true },
        chapter: { type: 'varchar', length: 50 },
        pattern: { type: 'jsonb' }
    },
    relations: {
        chapter_rel: {
            target: 'Chapter',
            type: 'many-to-one',
            joinColumn: { name: 'chapter' },
            inverseSide: 'slugs',
            onDelete: 'CASCADE'
        },
        tasks: { target: 'Task', type: 'one-to-many', inverseSide: 'slug_rel' }
    }
});