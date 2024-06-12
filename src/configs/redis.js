const Redis = require('redis');
const crypto = require('crypto');

class Client {
    constructor(conf) {
        this.client = Redis.createClient(conf);
        this.client.connect()
            .then(() => console.log('Connected to Redis'))
            .catch((err) => console.log('Redis Client Error', err));
    }

    async #newId(length=48) {
        let id;
        do { id = crypto.randomBytes(length).toString('hex'); } 
        while (await this.client.get(id));
        return id;
    }

    async newSession(user, ttl=6E5, keyLength) {
        const id = await this.#newId(keyLength);
        await this.client.set(id, user);
        await this.client.expire(id, ttl);
        return id;
    }

    async updateSessionId(id, ttl=6E5, keyLength) {
        const newId = await this.#newId(keyLength);
        await this.client.rename(id, newId);
        await this.client.expire(newId, ttl);
        return newId;
    }

    async removeSession(id) {
        await this.client.del(id);
    }

    async auth(req, res, next) {
        res.set({ 'Authorization' : '' });
        req.session = {};
        try {
            const authHeader = req.get('Authorization');
            if (!authHeader) return next();
            const [username, id] = authHeader.split(" ");
            if (id && await this.client.get(id) === username) {
                const newId = await this.updateSessionId(id);
                res.set({ 'Authorization' : `${username} ${newId}` });
                req.session = {username: username, id: newId};
            }
        } catch (err) { return next(err); }
        return next();
    }
}

const client = new Client({
    url: process.env.REDIS_URI,
    password: process.env.REDIS_PASSWORD
});

module.exports = client;