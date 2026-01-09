import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { isDbEnabled } from '@/lib/db';

const ADMIN_SESSION_COOKIE = 'meihua_admin_session';
const SESSION_MAX_AGE = 24 * 60 * 60; // 24 hours

// 简单的 session token 生成
function generateSessionToken(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2);
    return `${timestamp}-${random}`;
}

// 验证 session token（简单实现，生产环境建议使用 JWT）
function hashPassword(password: string, secret: string): string {
    // 简单哈希，生产环境建议使用更安全的方法
    let hash = 0;
    const str = password + secret;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return hash.toString(36);
}

// 登录
export async function POST(req: Request) {
    try {
        if (!isDbEnabled()) {
            return NextResponse.json(
                { error: 'Admin panel not available' },
                { status: 503 }
            );
        }

        const { password } = await req.json();
        const adminPassword = process.env.ADMIN_PASSWORD;
        const sessionSecret = process.env.ADMIN_SESSION_SECRET;

        if (!adminPassword || !sessionSecret) {
            return NextResponse.json(
                { error: 'Admin not configured' },
                { status: 500 }
            );
        }

        if (password !== adminPassword) {
            return NextResponse.json(
                { error: 'Invalid password' },
                { status: 401 }
            );
        }

        // 生成 session token
        const sessionToken = generateSessionToken();
        const tokenHash = hashPassword(sessionToken, sessionSecret);

        const response = NextResponse.json({
            success: true,
            message: 'Logged in successfully',
        });

        // 设置 session cookie
        response.cookies.set(ADMIN_SESSION_COOKIE, `${sessionToken}:${tokenHash}`, {
            maxAge: SESSION_MAX_AGE,
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
        });

        return response;
    } catch (error) {
        console.error('Admin login error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// 检查登录状态
export async function GET() {
    try {
        if (!isDbEnabled()) {
            return NextResponse.json({ authenticated: false, dbEnabled: false });
        }

        const cookieStore = await cookies();
        const sessionCookie = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
        const sessionSecret = process.env.ADMIN_SESSION_SECRET;

        if (!sessionCookie || !sessionSecret) {
            return NextResponse.json({ authenticated: false, dbEnabled: true });
        }

        const [token, hash] = sessionCookie.split(':');
        const expectedHash = hashPassword(token, sessionSecret);

        if (hash !== expectedHash) {
            return NextResponse.json({ authenticated: false, dbEnabled: true });
        }

        return NextResponse.json({ authenticated: true, dbEnabled: true });
    } catch (error) {
        console.error('Auth check error:', error);
        return NextResponse.json({ authenticated: false, dbEnabled: true });
    }
}

// 登出
export async function DELETE() {
    const response = NextResponse.json({ success: true });
    response.cookies.delete(ADMIN_SESSION_COOKIE);
    return response;
}
