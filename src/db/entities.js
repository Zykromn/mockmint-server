import { EntitySchema } from "typeorm";

// ==========================================
// SCHEMA: public (Users & Auth)
// ==========================================
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

export const Token = new EntitySchema({
    name: 'Token',
    schema: 'public',
    tableName: 'tokens',
    columns: {
        id:         { type: 'uuid', primary: true, generated: 'uuid' },
        client_id:  { type: 'uuid' },
        token:      { type: 'varchar', length: 255, unique: true },
        type:       { type: 'varchar', length: 50 }, // 'verify_email' | 'reset_password'
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

// ==========================================
// SCHEMA: math_values (Dictionary & Content)
// ==========================================
export const Chapter = new EntitySchema({
    name: 'Chapter',
    schema: 'math_values',
    tableName: 'chapters',
    columns: {
        chapter: { type: 'varchar', length: 50, primary: true },
        title:   { type: 'jsonb', unique: true }
    },
    relations: {
        slugs: { target: 'Slug', type: 'one-to-many', inverseSide: 'chapter_rel' }
    }
});

export const Slug = new EntitySchema({
    name: 'Slug',
    schema: 'math_values',
    tableName: 'slugs',
    columns: {
        slug:    { type: 'varchar', length: 100, primary: true },
        chapter: { type: 'varchar', length: 50 },
        pattern: { type: 'jsonb', unique: true }
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

// ==========================================
// SCHEMA: math_mocks (User Progress)
// ==========================================
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