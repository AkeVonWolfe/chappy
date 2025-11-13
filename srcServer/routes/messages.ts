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

  if (!channelId) { // validate channelId
    return res.status(400).json({
      success: false,
      message: "Channel ID is required",
    });
  }

  try {
    const result = await db.send(
      new ScanCommand({
        TableName: myTable,
        FilterExpression: "channelId = :channelId", // filter by channelId
        ExpressionAttributeValues: { 
          ":channelId": channelId,  // value for filter
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
// router.get("/user/:userId/sent", async (
//     req: Request<{ userId: string }>, 
//     res: Response<SuccessResponse<MessageItem> | ErrorResponse>
// ) => {
//     const { userId } = req.params
    
//     try {
//         // Query messages sent BY this user (uses primary key)
//         const result = await db.send(
//             new QueryCommand({
//                 TableName: myTable,
//                 KeyConditionExpression: "pk = :pk",
//                 ExpressionAttributeValues: {
//                     ":pk": `MESSAGE#USER#${userId}`
//                 },
//                 ScanIndexForward: true
//             })
//         )
        
//         const messages = (result.Items || []) as MessageItem[]
        
//         res.status(200).send({
//             success: true,
//             count: messages.length,
//             items: messages
//         })
//     } catch (error) {
//         res.status(500).send({
//             success: false,
//             error: (error as Error).message,
//             message: "Could not retrieve sent messages"
//         })
//     }
// })

// GET all direct messages between two users
// Route: /messages/direct/:userA/:userB
// GET all direct messages between two users
router.get("/direct/:userA/:userB", async (req, res) => {
  const { userA, userB } = req.params;      

  try {
    // Normalize IDs remove or add USER# prefix if needed
    const normalize = (id: string) => id.replace(/^USER#/, "");   // remove prefix if exists
    const a = normalize(userA); // normalize userA ID
    const b = normalize(userB); // normalize userB ID

    const [fromAtoB, fromBtoA] = await Promise.all([ // fetch messages in both directions
      db.send(
        new QueryCommand({
          TableName: myTable,
          KeyConditionExpression: "pk = :pk AND begins_with(sk, :skPrefix)",  // query by pk and sk prefix
          ExpressionAttributeValues: {
            ":pk": `MESSAGE#USER#${a}`,  // messages sent by userA
            ":skPrefix": `USER#${b}`,    // messages to userB
          },
        })
      ),
      db.send(
        new QueryCommand({
          TableName: myTable,
          KeyConditionExpression: "pk = :pk AND begins_with(sk, :skPrefix)",  // query by pk and sk prefix
          ExpressionAttributeValues: {
            ":pk": `MESSAGE#USER#${b}`,  // messages sent by userB
            ":skPrefix": `USER#${a}`,  // messages to userA
          },
        })
      ),
    ]);

    const allMessages = [  // combine and sort messages from both users
      ...(fromAtoB.Items ?? []),  // messages from A to B
      ...(fromBtoA.Items ?? []), // messages from B to A
    ].sort((a, b) =>
      a.timestamp > b.timestamp ? 1 : a.timestamp < b.timestamp ? -1 : 0  // sort by timestamp ascending
    );

    res.status(200).send({
      success: true,
      count: allMessages.length,
      items: allMessages,
    });
  } catch (error) {
    console.error("Error fetching direct messages:", error);
    res.status(500).send({
      success: false,
      message: "Failed to fetch direct messages",
      error: (error as Error).message,
    });
  }
});



// POST message in Channel
// Route: /messages/channel/:channelId
router.post("/:channelId", async (req, res) => {
  const { channelId } = req.params;
  const { message, senderId } = req.body;

  if (!message || !senderId) {  // validate input
    return res.status(400).send({
      success: false,
      message: "Message and senderId are required",
    });
  }

  const timestamp = new Date().toISOString();  // current timestamp

  const newMessage = {  // new message object
    pk: `MESSAGE#CHANNEL#${channelId}`,  // partition key for channel messages
    sk: `MESSAGE#${timestamp}`,    // sort key with timestamp
    message,  // message content
    senderId,  // sender user ID
    channelId,  // channel ID
    timestamp,  // message timestamp
  };

  try {
    await db.send(
      new PutCommand({   // save new message to DB
        TableName: myTable,
        Item: newMessage,
      })
    );

    res.status(201).send({
      success: true,
      message: "Message sent successfully",
      item: newMessage,
    });
  } catch (error) {
    console.error("Error sending message:", error);
    res.status(500).send({
      success: false,
      message: "Failed to send message",
      error: (error as Error).message,
    });
  }
});


// POST direct message (user to user)
// Route: /messages/direct/:recipientId
router.post("/direct/:senderId/:recipientId", async (req, res) => {
  const { senderId, recipientId } = req.params;
  const { message } = req.body;

  if (!message || !senderId || !recipientId) {  // validate input
    return res.status(400).send({
      success: false,
      message: "Message, senderId and recipientId are required",
    });
  }

  const timestamp = new Date().toISOString();  // current timestamp

  const newMessage = {  // new direct message object
    pk: `MESSAGE#USER#${senderId}`,  // partition key for sender
    sk: `USER#${recipientId}#${timestamp}`,  // sort key with recipient and timestamp
    message,  // message content
    senderId,  // sender user ID
    recipientId,  // recipient user ID
    timestamp,  // message timestamp
  };

  try {
    await db.send(
      new PutCommand({  // save new direct message to DB
        TableName: myTable,
        Item: newMessage,
      })
    );

    res.status(201).send({
      success: true,
      message: "Direct message sent successfully",
      item: newMessage,
    });
  } catch (error) {
    console.error("Error sending direct message:", error);
    res.status(500).send({
      success: false,
      message: "Failed to send direct message",
      error: (error as Error).message,
    });
  }
});

export default router