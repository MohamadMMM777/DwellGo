const prisma = require('../prismaClient');

// ── createReport (POST /api/reports) ─────────────────────────────────────────

exports.createReport = async (req, res) => {
    try {
        const { targetType, targetId, reason, description } = req.body;
        const reporterId = req.user.id;

        const validTargets = ['USER', 'PLACE', 'BOOKING', 'MESSAGE', 'REVIEW'];
        if (!validTargets.includes(targetType)) {
            return res.status(400).json({ error: 'Invalid report target type' });
        }
        if (!reason || reason.trim().length === 0) {
            return res.status(400).json({ error: 'Reason is required' });
        }
        if (!targetId) {
            return res.status(400).json({ error: 'Target ID is required' });
        }

        // Prevent duplicate open reports
        const existing = await prisma.report.findFirst({
            where: { reporterId, targetType, targetId, status: { in: ['OPEN', 'IN_REVIEW'] } }
        });
        if (existing) {
            return res.status(400).json({ error: 'You have already reported this. Our team is reviewing it.' });
        }

        const report = await prisma.report.create({
            data: {
                reporterId,
                targetType,
                targetId,
                reason: reason.trim(),
                description: description?.trim() || null,
                status: 'OPEN'
            }
        });

        // Notify all admins
        const admins = await prisma.user.findMany({ where: { role: 'ADMIN' }, select: { id: true } });
        for (const admin of admins) {
            try {
                await prisma.notification.create({
                    data: {
                        userId: admin.id,
                        title: 'Yeni Şikayet',
                        message: `Yeni bir ${targetType === 'PLACE' ? 'ilan' : targetType === 'USER' ? 'kullanıcı' : 'içerik'} şikayeti gönderildi: "${reason}"`,
                        type: 'SYSTEM',
                        relatedId: report.id
                    }
                });
            } catch (e) { /* non-critical */ }
        }

        res.status(201).json({ ...report, _id: report.id, message: 'Report submitted. Our team will review it shortly.' });
    } catch (err) {
        console.error('createReport error:', err);
        res.status(500).json({ error: 'Failed to submit report' });
    }
};

// ── getMyReports (GET /api/reports/mine) ─────────────────────────────────────

exports.getMyReports = async (req, res) => {
    try {
        const reports = await prisma.report.findMany({
            where: { reporterId: req.user.id },
            orderBy: { createdAt: 'desc' }
        });
        res.json(reports.map(r => ({ ...r, _id: r.id })));
    } catch (err) {
        console.error('getMyReports error:', err);
        res.status(500).json({ error: 'Failed to fetch your reports' });
    }
};
