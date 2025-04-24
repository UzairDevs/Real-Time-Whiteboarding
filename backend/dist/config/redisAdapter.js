"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupRedisAdapter = setupRedisAdapter;
// src/config/redisAdapter.ts
const redis_1 = require("redis");
const redis_adapter_1 = require("@socket.io/redis-adapter");
function setupRedisAdapter(io) {
    return __awaiter(this, void 0, void 0, function* () {
        const pubClient = (0, redis_1.createClient)({ url: 'redis://localhost:6379' });
        const subClient = pubClient.duplicate();
        yield Promise.all([pubClient.connect(), subClient.connect()]);
        io.adapter((0, redis_adapter_1.createAdapter)(pubClient, subClient));
        console.log("Redis adapter connected");
    });
}
