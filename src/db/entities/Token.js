import {EntitySchema} from "typeorm";

export const Token = new EntitySchema({
    name: 'Token',
    schema: 'public',
    tableName: 'tokens',
    columns: {
        id:         { type: 'uuid', primary: true, generated: 'uuid' },
        client_id:  { type: 'uuid' },
        token:      { type: 'varchar', length: 255, unique: true },
        type:       { type: 'varchar', length: 50 },
        expires_at: { type: 'timestamp' }
    },
    relations: {
        client: {
            target: 'Client',
            type: 'many-to-one',
            joinColumn: { name: 'client_id' },
            inverseSide: 'tokens',
            onDelete: 'CASCADE'
        }
    }
});