import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { isDbEnabled, getSetting, setSetting, initDatabase } from '@/lib/db';

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

    let hashValue = 0;
    const str = token + sessionSecret;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hashValue = ((hashValue << 5) - hashValue) + char;
        hashValue = hashValue & hashValue;
    }

    return hash === hashValue.toString(36);
}

// 获取所有设置
export async function GET() {
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

        await initDatabase();

        const settings = {
            requireLogin: await getSetting('require_login', false),
            siteTitle: await getSetting('site_title', '梅花易数'),
        };

        return NextResponse.json(settings);
    } catch (error) {
        console.error('Get settings error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// 更新设置
export async function PUT(req: Request) {
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

        const updates = await req.json();

        await initDatabase();

        // 更新每个设置
        if (typeof updates.requireLogin !== 'undefined') {
            await setSetting('require_login', updates.requireLogin);
        }
        if (typeof updates.siteTitle !== 'undefined') {
            await setSetting('site_title', updates.siteTitle);
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Update settings error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
