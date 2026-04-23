import {EntitySchema} from "typeorm";

export const Client = new EntitySchema({
    name: 'Client',
    schema: 'public',
    tableName: 'clients',
    columns: {
        id:          { type: 'uuid', primary: true, generated: 'uuid' },
        alias:       { type: 'text' },
        email:       { type: 'varchar', length: 100, unique: true },
        password:    { type: 'varchar', length: 255, nullable: true },
        google_auth: { type: 'varchar', length: 255, nullable: true },
        payment_id:  { type: 'varchar', length: 255, nullable: true },
        sub_status:  { type: 'boolean', default: false },
        sub_exp:     { type: 'timestamp', nullable: true },
        is_verified: { type: 'boolean', default: false }
    },
    relations: {
        mocks: { target: 'Mock', type: 'one-to-many', inverseSide: 'client' },
        tokens: { target: 'Token', type: 'one-to-many', inverseSide: 'client', cascade: true }
    }
});
