import {EntitySchema} from "typeorm";

export const Task = new EntitySchema({
    name: 'Task',
    schema: 'math_values',
    tableName: 'tasks',
    columns: {
        id:          { type: 'uuid', primary: true, generated: 'uuid' },
        slug:        { type: 'varchar', length: 100 },
        version:     { type: 'varchar', length: 10 },
        seed:        { type: 'int' },
        answer:      { type: 'text' },
        distractors: { type: 'jsonb' },
        context:     { type: 'jsonb' }
    },
    relations: {
        slug_rel: {
            target: 'Slug',
            type: 'many-to-one',
            joinColumn: { name: 'slug' },
            inverseSide: 'tasks',
            onDelete: 'CASCADE'
        },
        tests: { target: 'Test', type: 'one-to-many', inverseSide: 'task' }
    }
});
