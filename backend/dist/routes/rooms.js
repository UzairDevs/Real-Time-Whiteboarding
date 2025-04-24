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
const uuid_1 = require("uuid");
const client_1 = __importDefault(require("../db/src/client"));
const router = (0, express_1.Router)();
//writing logic to create a route.
// anybody can create a room 
router.post("/", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { allowDraw = true, recording = true, adminId } = req.body;
    const code = (0, uuid_1.v4)().slice(0, 6).toUpperCase();
    try {
        const rooms = yield client_1.default.room.create({
            data: {
                code, allowDraw, recording, adminId
            }
        });
        res.status(201).json(rooms);
    }
    catch (err) {
        console.log(err);
        res.status(404).json({
            msg: "Error Occured while creating a Room.",
        });
    }
}));
router.post("/:code", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { code } = req.params; //in fe we will have enter the code
    try {
        const findRoom = yield client_1.default.room.findUnique({
            where: {
                code
            },
            select: { code: true, allowDraw: true, recording: true, adminId: true }
        });
        if (!findRoom) {
            res.status(500).json({
                msg: "Unable to find the room"
            });
        }
        //we need to create a ws connection and make user connect to the
        res.status(200).json(findRoom);
    }
    catch (err) {
        console.log(err);
        res.status(500).json({
            msg: "Error Occured, Unable to fetch the room!"
        });
    }
}));
router.put("/:code", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { code } = req.params;
    const { allowDraw, recording } = req.body;
    try {
        const updatedRoom = yield client_1.default.room.update({
            where: {
                code
            },
            data: {
                allowDraw: allowDraw !== null && allowDraw !== void 0 ? allowDraw : undefined,
                recording: recording !== null && recording !== void 0 ? recording : undefined
            }
        });
        res.json(updatedRoom);
    }
    catch (err) {
        console.log(err);
        res.status(500).json({
            msg: "Error Occured while updating the room."
        });
    }
}));
exports.default = router;
