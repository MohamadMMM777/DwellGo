const prisma = require('../prismaClient');


const getOrCreateConversation = async (req, res) => {
    try {
        const myId = req.user.id;
        const { otherUserId } = req.body;

        if (!otherUserId) return res.status(400).json({ message: 'otherUserId is required' });
        if (myId === otherUserId) return res.status(400).json({ message: 'Cannot start conversation with yourself' });

        const participantsMatch = await prisma.conversationParticipant.groupBy({
            by: ['conversationId'],
            where: { userId: { in: [myId, otherUserId] } },
        });

        const convIdsWithUsers = participantsMatch.map(p => p.conversationId);
        let foundConvId = null;

        for (const cid of convIdsWithUsers) {
            const count = await prisma.conversationParticipant.count({ where: { conversationId: cid } });
            if (count === 2) {
                // Determine if both target users are exactly the participants
                const users = await prisma.conversationParticipant.findMany({ where: { conversationId: cid } });
                const uIds = users.map(u => u.userId);
                if (uIds.includes(myId) && uIds.includes(otherUserId)) {
                    foundConvId = cid;
                    break;
                }
            }
        }

        let conversation;
        if (!foundConvId) {
            // Let Prisma use @default(cuid()) for IDs — avoids duplicate-ID bug
            // when getNextId is called twice before any insert
            conversation = await prisma.conversation.create({
                data: {
                    participants: {
                        create: [
                            { userId: myId },
                            { userId: otherUserId }
                        ]
                    }
                },
                include: { participants: { include: { user: { select: { id: true, profile: { select: { name: true } } } } } } }
            });
        } else {
            conversation = await prisma.conversation.findUnique({
                where: { id: foundConvId },
                include: { participants: { include: { user: { select: { id: true, profile: { select: { name: true } } } } } } }
            });
        }

        const mapped = {
            ...conversation,
            _id: conversation.id,
            participants: conversation.participants.map(p => ({ ...p.user, name: p.user.profile?.name, _id: p.user.id }))
        };

        res.json(mapped);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

const getMyConversations = async (req, res) => {
    try {
        const myId = req.user.id;
        const convs = await prisma.conversation.findMany({
            where: { participants: { some: { userId: myId } } },
            include: { participants: { include: { user: { select: { id: true, profile: { select: { name: true } } } } } } },
            orderBy: { updatedAt: 'desc' }
        });

        const mapped = convs.map(c => ({
            ...c, _id: c.id,
            participants: c.participants.map(p => ({ ...p.user, name: p.user.profile?.name, _id: p.user.id }))
        }));
        res.json(mapped);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
};

const getMessages = async (req, res) => {
    try {
        const myId = req.user.id;
        const { id: convId } = req.params;

        const count = await prisma.conversationParticipant.count({ where: { conversationId: convId, userId: myId } });
        if (count === 0) return res.status(403).json({ message: 'Access denied' });

        const messages = await prisma.message.findMany({
            where: { conversationId: convId },
            include: { sender: { select: { id: true, profile: { select: { name: true } } } } },
            orderBy: { createdAt: 'asc' }
        });

        const mapped = messages.map(m => ({
            ...m, _id: m.id,
            sender: { ...m.sender, name: m.sender.profile?.name, _id: m.sender.id }
        }));
        res.json(mapped);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
};

const sendMessage = async (req, res) => {
    try {
        const myId = req.user.id;
        const { id: convId } = req.params;
        const { text } = req.body;

        const count = await prisma.conversationParticipant.count({ where: { conversationId: convId, userId: myId } });
        if (count === 0) return res.status(403).json({ message: 'Access denied' });

        const message = await prisma.message.create({
            data: { conversationId: convId, senderId: myId, text: text.trim() },
            include: { sender: { select: { id: true, profile: { select: { name: true } } } } }
        });

        await prisma.conversation.update({ where: { id: convId }, data: { updatedAt: new Date() } });

        // Add Notification for recipient
        try {
            const participants = await prisma.conversationParticipant.findMany({ where: { conversationId: convId } });
            for (let p of participants) {
                if (p.userId !== myId) {
                    await prisma.notification.create({
                        data: {
                            userId: p.userId,
                            title: 'Yeni Mesaj',
                            message: `${req.user?.profile?.name || req.user?.email || 'Biri'} size yeni bir mesaj gönderdi.`,
                            type: 'MESSAGE_NEW',
                            relatedId: convId
                        }
                    });
                }
            }
        } catch (notifErr) {
            console.error('Failed to create notification for message:', notifErr);
        }

        res.json({ ...message, _id: message.id, sender: { ...message.sender, name: message.sender.profile?.name, _id: message.sender.id } });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
};

const markAsRead = async (req, res) => {
    try {
        const myId = req.user.id;
        const { id: convId } = req.params;

        const count = await prisma.conversationParticipant.count({ where: { conversationId: convId, userId: myId } });
        if (count === 0) return res.status(403).json({ message: 'Access denied' });

        await prisma.message.updateMany({
            where: { conversationId: convId, senderId: { not: myId }, read: false },
            data: { read: true, readAt: new Date() }
        });

        res.json({ ok: true });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = { getOrCreateConversation, getMyConversations, getMessages, sendMessage, markAsRead };
