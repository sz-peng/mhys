import postgres from 'postgres';

// 检查数据库配置
function validateDbConfig() {
    const dbUrl = process.env.DATABASE_URL;

    if (!dbUrl) {
        return { enabled: false, error: null };
    }

    const adminPassword = process.env.ADMIN_PASSWORD;
    const sessionSecret = process.env.ADMIN_SESSION_SECRET;

    if (!adminPassword) {
        throw new Error(
            '❌ DATABASE_URL is set but ADMIN_PASSWORD is missing.\n' +
            '   Please set ADMIN_PASSWORD in your environment variables.'
        );
    }

    if (!sessionSecret) {
        throw new Error(
            '❌ DATABASE_URL is set but ADMIN_SESSION_SECRET is missing.\n' +
            '   Please set ADMIN_SESSION_SECRET in your environment variables.'
        );
    }

    if (sessionSecret.length < 32) {
        throw new Error(
            '❌ ADMIN_SESSION_SECRET must be at least 32 characters long.'
        );
    }

    return { enabled: true, error: null };
}

// 数据库是否启用
let _dbEnabled: boolean | null = null;

export function isDbEnabled(): boolean {
    if (_dbEnabled === null) {
        try {
            const config = validateDbConfig();
            _dbEnabled = config.enabled;
        } catch {
            _dbEnabled = false;
        }
    }
    return _dbEnabled;
}

// 创建数据库连接（仅在启用时）
let _sql: postgres.Sql | null = null;

export function getDb(): postgres.Sql {
    if (!isDbEnabled()) {
        throw new Error('Database is not enabled. Set DATABASE_URL to enable.');
    }

    if (!_sql) {
        _sql = postgres(process.env.DATABASE_URL!, {
            ssl: 'require',
            max: 10,
            idle_timeout: 20,
            connect_timeout: 10,
        });
    }

    return _sql;
}

// 数据库类型定义
export interface DbUser {
    id: string;
    created_at: Date;
    last_visit: Date;
}

export interface DbDivinationRecord {
    id: string;
    user_id: string;
    question: string | null;
    result: unknown;
    interpretation: string | null;
    created_at: Date;
}

export interface DbSettings {
    key: string;
    value: unknown;
    updated_at: Date;
}

// 初始化数据库表
export async function initDatabase(): Promise<void> {
    if (!isDbEnabled()) return;

    const sql = getDb();

    await sql`
        CREATE TABLE IF NOT EXISTS users (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            created_at TIMESTAMPTZ DEFAULT NOW(),
            last_visit TIMESTAMPTZ DEFAULT NOW()
        )
    `;

    await sql`
        CREATE TABLE IF NOT EXISTS divination_records (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID REFERENCES users(id) ON DELETE CASCADE,
            question TEXT,
            result JSONB NOT NULL,
            interpretation TEXT,
            created_at TIMESTAMPTZ DEFAULT NOW()
        )
    `;

    await sql`
        CREATE TABLE IF NOT EXISTS settings (
            key TEXT PRIMARY KEY,
            value JSONB NOT NULL,
            updated_at TIMESTAMPTZ DEFAULT NOW()
        )
    `;

    // 创建索引
    await sql`
        CREATE INDEX IF NOT EXISTS idx_records_user_id ON divination_records(user_id)
    `;

    await sql`
        CREATE INDEX IF NOT EXISTS idx_records_created_at ON divination_records(created_at DESC)
    `;
}

// 用户操作
export async function getOrCreateUser(userId: string): Promise<DbUser> {
    const sql = getDb();

    const [existing] = await sql<DbUser[]>`
        SELECT * FROM users WHERE id = ${userId}
    `;

    if (existing) {
        await sql`UPDATE users SET last_visit = NOW() WHERE id = ${userId}`;
        return existing;
    }

    const [newUser] = await sql<DbUser[]>`
        INSERT INTO users (id) VALUES (${userId}) RETURNING *
    `;

    return newUser;
}

// 占卜记录操作
export async function saveDivinationRecord(
    userId: string,
    question: string,
    result: unknown,
    interpretation: string
): Promise<DbDivinationRecord> {
    const sql = getDb();

    // 确保用户存在
    await getOrCreateUser(userId);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [record] = await sql<DbDivinationRecord[]>`
        INSERT INTO divination_records (user_id, question, result, interpretation)
        VALUES (${userId}, ${question}, ${sql.json(result as never)}, ${interpretation})
        RETURNING *
    `;

    return record;
}

export async function getUserRecords(
    userId: string,
    limit = 50
): Promise<DbDivinationRecord[]> {
    const sql = getDb();

    return sql<DbDivinationRecord[]>`
        SELECT * FROM divination_records
        WHERE user_id = ${userId}
        ORDER BY created_at DESC
        LIMIT ${limit}
    `;
}

export async function deleteRecord(recordId: string): Promise<void> {
    const sql = getDb();
    await sql`DELETE FROM divination_records WHERE id = ${recordId}`;
}

// 统计操作
export async function getStats(): Promise<{
    totalUsers: number;
    totalDivinations: number;
    todayDivinations: number;
}> {
    const sql = getDb();

    const [userCount] = await sql<[{ count: string }]>`
        SELECT COUNT(*) as count FROM users
    `;

    const [totalCount] = await sql<[{ count: string }]>`
        SELECT COUNT(*) as count FROM divination_records
    `;

    const [todayCount] = await sql<[{ count: string }]>`
        SELECT COUNT(*) as count FROM divination_records
        WHERE created_at >= CURRENT_DATE
    `;

    return {
        totalUsers: parseInt(userCount.count, 10),
        totalDivinations: parseInt(totalCount.count, 10),
        todayDivinations: parseInt(todayCount.count, 10),
    };
}

// 管理员：获取所有记录
export async function getAllRecords(
    page = 1,
    pageSize = 20,
    search?: string
): Promise<{ records: DbDivinationRecord[]; total: number }> {
    const sql = getDb();
    const offset = (page - 1) * pageSize;

    let records: DbDivinationRecord[];
    let total: number;

    if (search) {
        const searchPattern = `%${search}%`;
        records = await sql<DbDivinationRecord[]>`
            SELECT * FROM divination_records
            WHERE question ILIKE ${searchPattern}
            ORDER BY created_at DESC
            LIMIT ${pageSize} OFFSET ${offset}
        `;
        const [countResult] = await sql<[{ count: string }]>`
            SELECT COUNT(*) as count FROM divination_records
            WHERE question ILIKE ${searchPattern}
        `;
        total = parseInt(countResult.count, 10);
    } else {
        records = await sql<DbDivinationRecord[]>`
            SELECT * FROM divination_records
            ORDER BY created_at DESC
            LIMIT ${pageSize} OFFSET ${offset}
        `;
        const [countResult] = await sql<[{ count: string }]>`
            SELECT COUNT(*) as count FROM divination_records
        `;
        total = parseInt(countResult.count, 10);
    }

    return { records, total };
}

// 设置操作
export async function getSetting<T>(key: string, defaultValue: T): Promise<T> {
    const sql = getDb();

    const [setting] = await sql<DbSettings[]>`
        SELECT * FROM settings WHERE key = ${key}
    `;

    if (!setting) return defaultValue;

    let value = setting.value as T;

    // 处理可能的双重 JSON 编码（旧数据兼容）
    // 如果值是字符串且两端有引号，尝试解析
    if (typeof value === 'string' && value.startsWith('"') && value.endsWith('"')) {
        try {
            value = JSON.parse(value) as T;
        } catch {
            // 解析失败则保持原值
        }
    }

    return value;
}

export async function setSetting<T>(key: string, value: T): Promise<void> {
    const sql = getDb();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await sql`
        INSERT INTO settings (key, value, updated_at)
        VALUES (${key}, ${sql.json(value as never)}, NOW())
        ON CONFLICT (key) DO UPDATE SET
            value = EXCLUDED.value,
            updated_at = NOW()
    `;
}
