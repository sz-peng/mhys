import { NextResponse } from 'next/server';
import { isDbEnabled, saveDivinationRecord, initDatabase } from '@/lib/db';
import { cookies } from 'next/headers';

const USER_ID_COOKIE = 'meihua_user_id';

// 生成 UUID
function generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

// 获取或创建用户 ID
async function getOrCreateUserId(): Promise<string> {
    const cookieStore = await cookies();
    let userId = cookieStore.get(USER_ID_COOKIE)?.value;

    if (!userId) {
        userId = generateUUID();
    }

    return userId;
}

export async function POST(req: Request) {
    try {
        // 检查数据库是否启用
        if (!isDbEnabled()) {
            return NextResponse.json(
                { error: 'Database not configured', code: 'DB_DISABLED' },
                { status: 503 }
            );
        }

        const { question, result, interpretation } = await req.json();

        if (!result) {
            return NextResponse.json(
                { error: 'Missing required field: result' },
                { status: 400 }
            );
        }

        // 初始化数据库表（如果不存在）
        await initDatabase();

        // 获取用户 ID
        const userId = await getOrCreateUserId();

        // 保存记录
        const record = await saveDivinationRecord(
            userId,
            question || '',
            result,
            interpretation || ''
        );

        // 创建响应并设置 cookie
        const response = NextResponse.json({
            success: true,
            record: {
                id: record.id,
                created_at: record.created_at,
            },
        });

        // 设置用户 ID cookie（1 年有效期）
        response.cookies.set(USER_ID_COOKIE, userId, {
            maxAge: 365 * 24 * 60 * 60,
            httpOnly: false,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
        });

        return response;
    } catch (error) {
        console.error('Save divination error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
