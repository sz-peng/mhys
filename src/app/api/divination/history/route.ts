import { NextResponse } from 'next/server';
import { isDbEnabled, getUserRecords, initDatabase } from '@/lib/db';
import { cookies } from 'next/headers';

const USER_ID_COOKIE = 'meihua_user_id';

export async function GET() {
    try {
        // 检查数据库是否启用
        if (!isDbEnabled()) {
            return NextResponse.json(
                { error: 'Database not configured', code: 'DB_DISABLED' },
                { status: 503 }
            );
        }

        // 获取用户 ID
        const cookieStore = await cookies();
        const userId = cookieStore.get(USER_ID_COOKIE)?.value;

        if (!userId) {
            return NextResponse.json({ records: [] });
        }

        // 初始化数据库表（如果不存在）
        await initDatabase();

        // 获取用户记录
        const records = await getUserRecords(userId);

        return NextResponse.json({
            records: records.map(r => ({
                id: r.id,
                question: r.question,
                result: r.result,
                interpretation: r.interpretation,
                created_at: r.created_at,
            })),
        });
    } catch (error) {
        console.error('Get history error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
