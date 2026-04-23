import {EntitySchema} from "typeorm";

export const Mock = new EntitySchema({
    name: 'Mock',
    schema: 'math_mocks',
    tableName: 'mocks',
    columns: {
        id:           { type: 'uuid', primary: true, generated: 'uuid' },
        client_id:    { type: 'uuid', nullable: true },
        status:       { type: 'varchar', length: 50, default: 'active' },
        created_at:   { type: 'timestamp', createDate: true },
        config:       { type: 'jsonb' },
        points:       { type: 'int', default: 0 },
        timer:        { type: 'bigint', nullable: true },
    },
    relations: {
        tests: { target: 'Test', type: 'one-to-many', inverseSide: 'mock', cascade: true },
        client: {
            target: 'Client',
            type: 'many-to-one',
            joinColumn: { name: 'client_id' },
            inverseSide: 'mocks',
            onDelete: 'SET NULL'
        }
    }
});