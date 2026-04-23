import {EntitySchema} from "typeorm";

export const Test = new EntitySchema({
    name: 'Test',
    schema: 'math_mocks',
    tableName: 'tests',
    columns: {
        mock_id:     { type: 'uuid', primary: true },
        task_id:     { type: 'uuid', primary: true },
        index:       { type: 'int' },
        response:    { type: 'text', nullable: true },
        is_correct:  { type: 'boolean', nullable: true }
    },
    relations: {
        mock: {
            target: 'Mock',
            type: 'many-to-one',
            joinColumn: { name: 'mock_id' },
            inverseSide: 'tests',
            onDelete: 'CASCADE'
        },
        task: {
            target: 'Task',
            type: 'many-to-one',
            joinColumn: { name: 'task_id' },
            inverseSide: 'tests',
            onDelete: 'CASCADE'
        }
    }
});