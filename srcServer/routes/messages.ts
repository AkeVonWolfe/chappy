import express from "express";
import type { Request, Response, Router } from "express";
import { db, myTable } from "../data/db.js";
import { messageSchema, UserSchema } from "../data/validation.js"
import type { ErrorResponse, OperationResult } from "../data/types.js";
import { PutCommand } from "@aws-sdk/lib-dynamodb";

const router: Router = express.Router()


interface MessageBody {
    message: string
    senderId: string // USER#1, USER#2, etc.
}

interface MessageItem {
    pk: string       // MESSAGE#USER#{userId}
    sk: string       // CHANNEL#{channelId}#{timestamp}
    message: string
    senderId: string
    channelId: string
    timestamp: string
}


// POST message in Channel
// Route: /messages/:channelId
router.post("/:channelId", async ( req: Request<{ channelId: string }, {}, MessageBody>, res: Response<OperationResult<MessageItem> |ErrorResponse>) => {

    // TODO: put validation as middleware?
    let validateResult = messageSchema.safeParse(req.body)
    
    if (!validateResult.success) {
        const errors = validateResult.error.issues.map((err) => ({
            field: err.path.join("."),
            message: err.message,
        }))
        return res.status(400).send({
            success: false,
            message: "Invalid message body",
            error: errors,
        })
    }
    
    const { message, senderId } = validateResult.data
    const { channelId } = req.params
    
    // Generate timestamp (ISO 8601 format for readability and sorting)
    const timestamp = new Date().toISOString()
    
    // Create the DynamoDB item with proper keys
    const newMessage: MessageItem = {
        pk: `MESSAGE#USER#${senderId}`,           // Who sent it
        sk: `CHANNEL#${channelId}#${timestamp}`,  // Where + when
        message,
        senderId,
        channelId,
        timestamp
    }
    
    try {
        await db.send(
            new PutCommand({
                TableName: myTable,
                Item: newMessage,
            })
        )
        res.status(201).send({
            success: true,
            message: "Message sent successfully",
            item: newMessage,
        })
    } catch (error) {
        res.status(500).send({
            success: false,
            error: (error as Error).message,
            message: "Could not post message"
        })
    }
})

// POST direct message (user to user)
// Route: /messages/direct/:recipientId
router.post("/direct/:recipientId", async (req: Request<{ recipientId: string }, {}, MessageBody>,res: Response<OperationResult<MessageItem> | ErrorResponse>) => {
    
    let validateResult = messageSchema.safeParse(req.body)
    
    if (!validateResult.success) {
        const errors = validateResult.error.issues.map((err) => ({
            field: err.path.join("."),
            message: err.message,
        }))
        return res.status(400).send({
            success: false,
            message: "Invalid message body",
            error: errors,
        })
    }
    
    const { message, senderId } = validateResult.data
    const { recipientId } = req.params
    const timestamp = new Date().toISOString()
    
    const newMessage: MessageItem = {
        pk: `MESSAGE#USER#${senderId}`,        // Who sent it
        sk: `USER#${recipientId}#${timestamp}`, // To whom + when
        message,
        senderId,
        channelId: recipientId, // Reusing field for recipient
        timestamp
    }
    
    try {
        await db.send(
            new PutCommand({
                TableName: myTable,
                Item: newMessage,
            })
        )
        res.status(201).send({
            success: true,
            message: "Direct message sent successfully",
            item: newMessage,
        })
    } catch (error) {
        res.status(500).send({
            success: false,
            error: (error as Error).message,
            message: "Could not send direct message"
        })
    }
})


export default router