import express from "express";
import type { Request, Response, Router } from "express";
import { db, myTable } from "../data/db.js";
import { messageSchema } from "../data/validation.js"
import type { ErrorResponse, OperationResult, SuccessResponse } from "../data/types.js";
import { PutCommand, QueryCommand, ScanCommand } from "@aws-sdk/lib-dynamodb";

const router: Router = express.Router()


interface MessageBody {
    message: string
    senderId: string // USER#1, USER#2, etc.
}

interface MessageItem {
    pk: string       // MESSAGE#USER#{userId}
    sk: string       // CHANNEL#{channelId}#{timestamp} or USER#{recipientId}#{timestamp}
    message: string
    senderId: string
    channelId: string
    timestamp: string
}


// GET all messages from a channel
// Route: /messages/channel/:channelId
router.get("/:channelId", async (req, res: Response) => {
  const { channelId } = req.params;

  if (!channelId) {
    return res.status(400).json({
      success: false,
      message: "Channel ID is required",
    });
  }

  try {
    const result = await db.send(
      new ScanCommand({
        TableName: myTable,
        FilterExpression: "channelId = :channelId",
        ExpressionAttributeValues: {
          ":channelId": channelId,
        },
      })
    );

    res.status(200).json({
      success: true,
      count: result.Count ?? 0,
      items: result.Items ?? [],
    });
  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).json({
      success: false,
      message: "Could not fetch messages",
      error: (error as Error).message,
    });
  }
});

// GET all messages sent BY a specific user
// Route: /messages/user/:userId/sent
router.get("/user/:userId/sent", async (
    req: Request<{ userId: string }>, 
    res: Response<SuccessResponse<MessageItem> | ErrorResponse>
) => {
    const { userId } = req.params
    
    try {
        // Query messages sent BY this user (uses primary key)
        const result = await db.send(
            new QueryCommand({
                TableName: myTable,
                KeyConditionExpression: "pk = :pk",
                ExpressionAttributeValues: {
                    ":pk": `MESSAGE#USER#${userId}`
                },
                ScanIndexForward: true
            })
        )
        
        const messages = (result.Items || []) as MessageItem[]
        
        res.status(200).send({
            success: true,
            count: messages.length,
            items: messages
        })
    } catch (error) {
        res.status(500).send({
            success: false,
            error: (error as Error).message,
            message: "Could not retrieve sent messages"
        })
    }
})

// GET all direct messages between two users
// Route: /messages/direct/:userA/:userB
router.get("/direct/:userA/:userB", async (req, res: Response) => {
  const { userA, userB } = req.params;

  if (!userA || !userB) {
    return res.status(400).send({
      success: false,
      message: "Both user IDs are required",
    });
  }

  try {
    // Query messages where userA is sender
    const resultA = await db.send(
      new QueryCommand({
        TableName: myTable,
        KeyConditionExpression: "pk = :pk AND begins_with(sk, :skPrefix)",
        ExpressionAttributeValues: {
          ":pk": `MESSAGE#USER#${userA}`,
          ":skPrefix": `USER#${userB}#`,
        },
      })
    );

    // Query messages where userB is sender
    const resultB = await db.send(
      new QueryCommand({
        TableName: myTable,
        KeyConditionExpression: "pk = :pk AND begins_with(sk, :skPrefix)",
        ExpressionAttributeValues: {
          ":pk": `MESSAGE#USER#${userB}`,
          ":skPrefix": `USER#${userA}#`,
        },
      })
    );

    // Combine and sort all messages by timestamp
    const combined = [...(resultA.Items ?? []), ...(resultB.Items ?? [])];
    combined.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    res.status(200).send({
      success: true,
      count: combined.length,
      items: combined,
    });
  } catch (error) {
    console.error("Error fetching direct messages:", error);
    res.status(500).send({
      success: false,
      message: "Could not fetch direct messages",
      error: (error as Error).message,
    });
  }
});


// POST message in Channel
// Route: /messages/channel/:channelId
router.post("/channel/:channelId", async (
    req: Request<{ channelId: string }, {}, MessageBody>, 
    res: Response<OperationResult<MessageItem> | ErrorResponse>
) => {
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
    
    const timestamp = new Date().toISOString()
    
    const newMessage: MessageItem = {
        pk: `MESSAGE#USER#${senderId}`,
        sk: `CHANNEL#${channelId}#${timestamp}`,
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
router.post("/direct/:recipientId", async (
    req: Request<{ recipientId: string }, {}, MessageBody>,
    res: Response<OperationResult<MessageItem> | ErrorResponse>
) => {
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
        pk: `MESSAGE#USER#${senderId}`,
        sk: `USER#${recipientId}#${timestamp}`,
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