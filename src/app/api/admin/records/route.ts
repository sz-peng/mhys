import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { isDbEnabled, getAllRecords, deleteRecord, initDatabase } from '@/lib/db';

const ADMIN_SESSION_COOKIE = 'meihua_admin_session';

// 验证管理员身份
async function verifyAdmin(): Promise<boolean> {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
    const sessionSecret = process.env.ADMIN_SESSION_SECRET;

    if (!sessionCookie || !sessionSecret) {
        return false;
    }

    const [token, hash] = sessionCookie.split(':');

    // 简单哈希验证
    let hashValue = 0;
    const str = token + sessionSecret;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hashValue = ((hashValue << 5) - hashValue) + char;
        hashValue = hashValue & hashValue;
    }

    return hash === hashValue.toString(36);
}

// 获取所有记录（分页）
export async function GET(req: Request) {
    try {
        if (!isDbEnabled()) {
            return NextResponse.json(
                { error: 'Database not configured' },
                { status: 503 }
            );
        }

        if (!await verifyAdmin()) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const { searchParams } = new URL(req.url);
        const page = parseInt(searchParams.get('page') || '1', 10);
        const pageSize = parseInt(searchParams.get('pageSize') || '20', 10);
        const search = searchParams.get('search') || undefined;

        await initDatabase();
        const { records, total } = await getAllRecords(page, pageSize, search);

        // 辅助函数：解析可能双重编码的 result（兼容旧数据）
        const parseResult = (result: unknown) => {
            // 如果已经是对象，直接返回
            if (typeof result === 'object' && result !== null) {
                return result;
            }
            // 如果是字符串（双重编码的旧数据），尝试解析
            if (typeof result === 'string') {
                try {
                    return JSON.parse(result);
                } catch {
                    return result;
                }
            }
            return result;
        };

        return NextResponse.json({
            records: records.map(r => ({
                id: r.id,
                user_id: r.user_id,
                question: r.question,
                result: parseResult(r.result),
                interpretation: r.interpretation,
                created_at: r.created_at,
            })),
            total,
            page,
            pageSize,
            totalPages: Math.ceil(total / pageSize),
        });
    } catch (error) {
        console.error('Get records error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// 删除记录
export async function DELETE(req: Request) {
    try {
        if (!isDbEnabled()) {
            return NextResponse.json(
                { error: 'Database not configured' },
                { status: 503 }
            );
        }

        if (!await verifyAdmin()) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const { id } = await req.json();

        if (!id) {
            return NextResponse.json(
                { error: 'Missing record id' },
                { status: 400 }
            );
        }

        await deleteRecord(id);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Delete record error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
