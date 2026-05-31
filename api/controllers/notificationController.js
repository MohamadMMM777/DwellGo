const prisma = require('../prismaClient');

const getMyNotifications = async (req, res) => {
    try {
        const userDoc = req.user;
        const notifications = await prisma.notification.findMany({
            where: { userId: userDoc.id },
            orderBy: { createdAt: 'desc' },
            take: 20
        });
        
        // Map to return _id for frontend compatibility
        res.json(notifications.map(n => ({ ...n, _id: n.id })));
    } catch (err) {
        console.error('Fetch notifications error:', err);
        res.status(500).json('Failed to fetch notifications');
    }
};

const markAsRead = async (req, res) => {
    try {
        const userDoc = req.user;
        const { id } = req.params;
        
        const notif = await prisma.notification.findUnique({ where: { id } });
        if (!notif) return res.status(404).json('Not found');
        if (notif.userId !== userDoc.id) return res.status(403).json('Not authorized');

        const updated = await prisma.notification.update({
            where: { id },
            data: { isRead: true }
        });

        res.json({ ...updated, _id: updated.id });
    } catch (err) {
        console.error('Update notification error:', err);
        res.status(500).json('Failed to update notification');
    }
};

const markAllAsRead = async (req, res) => {
    try {
        const userDoc = req.user;
        await prisma.notification.updateMany({
            where: { userId: userDoc.id },
            data: { isRead: true }
        });
        res.json('ok');
    } catch (err) {
        console.error('Mark all notifications error:', err);
        res.status(500).json('Failed to update notifications');
    }
};

module.exports = { getMyNotifications, markAsRead, markAllAsRead };
