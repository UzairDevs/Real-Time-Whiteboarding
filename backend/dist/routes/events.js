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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_1 = __importDefault(require("../db/src/client"));
const router = (0, express_1.Router)({ mergeParams: true });
router.get('/', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const code = req.params.code;
    const since = parseInt(req.query.since) || 0;
    try {
        const events = yield client_1.default.event.findMany({
            where: { roomCode: code, sequenceNo: { gt: since } },
            orderBy: { sequenceNo: 'asc' },
            select: { sequenceNo: true, type: true, payload: true, timestamp: true }
        });
        res.json({ events });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Unable to fetch events' });
    }
}));
exports.default = router;
