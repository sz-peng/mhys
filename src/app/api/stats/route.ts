import { NextResponse } from 'next/server';
import { isDbEnabled, getStats, initDatabase } from '@/lib/db';

export async function GET() {
    try {
        // 检查数据库是否启用
        if (!isDbEnabled()) {
            return NextResponse.json({
                enabled: false,
                totalUsers: 0,
                totalDivinations: 0,
                todayDivinations: 0,
            });
        }

        // 初始化数据库表（如果不存在）
        await initDatabase();

        // 获取统计数据
        const stats = await getStats();

        return NextResponse.json({
            enabled: true,
            ...stats,
        });
    } catch (error) {
        console.error('Get stats error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
