import { createClient } from 'redis';

let client: ReturnType<typeof createClient> | null = null;

export async function getRedisClient() {
    if (client && client.isOpen) {
        return client;
    }

    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

    client = createClient({ url: redisUrl });

    client.on('error', (err) => {
        console.error('Redis Client Error:', err);
    });

    await client.connect();
    return client;
}

// 发布消息到频道
export async function publishMessage(channel: string, message: object) {
    try {
        const redis = await getRedisClient();
        await redis.publish(channel, JSON.stringify(message));
    } catch (error) {
        console.error('Failed to publish message to Redis:', error);
    }
}
