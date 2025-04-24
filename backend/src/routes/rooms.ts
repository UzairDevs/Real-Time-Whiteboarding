import {Router} from 'express';
import {v4 as uuidv4 } from 'uuid';
import prisma from "../db/src/client";

const router = Router();
//writing logic to create a route.
// anybody can create a room 
router.post("/", async (req,res)=> {
    const { allowDraw = true, recording = true, adminId } = req.body;
    const code = uuidv4().slice(0, 6).toUpperCase();
    try {
        const rooms= await prisma.room.create({
            data: {
                code, allowDraw, recording, adminId
            }
        })
        res.status(201).json(rooms)

    }catch (err){
        console.log(err);
        res.status(404).json({
            msg: "Error Occured while creating a Room.",
        })
    }
})

router.post ("/:code", async(req,res)=> {
    const {code}= req.params;//in fe we will have enter the code
    try {
        const findRoom= await prisma.room.findUnique({
            where: {
                code
            },
            select: { code: true, allowDraw: true, recording: true, adminId: true }
        });
        if (!findRoom){
            res.status(500).json({
                msg: "Unable to find the room"
            })
        }
        //we need to create a ws connection and make user connect to the
        
        res.status(200).json(findRoom)
    }catch (err){
        console.log(err);
        res.status(500).json({
            msg: "Error Occured, Unable to fetch the room!"
        })
    }
    
})

router.put("/:code", async(req,res)=> {
    const {code}= req.params
    const {allowDraw, recording}= req.body;

    try {
        const updatedRoom = await prisma.room.update({
            where: {
                code
            },
            data: {
                allowDraw: allowDraw ?? undefined,
                recording: recording ?? undefined
            }
        })
        res.json(updatedRoom)
    } catch(err){
        console.log(err)
        res.status(500).json({
            msg: "Error Occured while updating the room."
        })
    }

})









export default router