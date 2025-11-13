import { DeleteCommand, PutCommand, QueryCommand, GetCommand } from "@aws-sdk/lib-dynamodb";
import express from "express";
import type { Request, Response, Router } from "express";
import { db, myTable } from "../data/db.js";
import type { ErrorResponse, OperationResult, SuccessResponse, IdParam, GetResult } from "../data/types.js"
import { randomUUID } from "crypto";
import { ChannelCreateSchema } from "../data/validation.js";
import { verifyToken } from "../data/auth.js"

const router: Router = express.Router()

// interface
interface Channel {
  pk: string
  sk: string
  name: string
  owner: string
}

interface ChannelCreateInput {
  name: string
  userId: string
}

interface ChannelResponse {
  id: string
  name: string
  ownerId: string
  Guest?: boolean;
}

// Generate a unique channel ID
function generateChannelId(): string {
  return randomUUID()
}



// get all channels
router.get("/", async (req, res: Response<SuccessResponse<ChannelResponse> | ErrorResponse>) => {
  try {
    const result: GetResult = await db.send(
      new QueryCommand({  // query all channels
        TableName: myTable,
        KeyConditionExpression: "pk = :pk AND begins_with(sk, :skPrefix)", // partition key and sort key condition 
        ExpressionAttributeValues: {
          ":pk": "CHANNELS",  // Partition key for channels
          ":skPrefix": "CHANNEL#",  // Sort key prefix for channels
        },
      })
    );

    interface DBItem {  // raw DB item interface for types 
      pk: string;
      sk: string;
      name?: string;
      owner?: string;
      [key: string]: unknown;
    }

    const rawItems: DBItem[] = (result.Items ?? []) as DBItem[];  // cast to DBItem array

    const channels = (rawItems  
      .map((item: DBItem) => toChannelResponse(item as Channel))  // convert to ChannelResponse
      .filter((ch) => ch !== null)) as ChannelResponse[];  // filter out nulls
    res.status(200).send({
      success: true,
      count: channels.length,
      items: channels,
    });
  } catch (error) {
    console.error("Error fetching channels:", error);
    res.status(500).send({
      success: false,
      error: (error as Error).message,
      message: "Could not fetch channels",
    });
  }
});

// Helper to convert DB item to ChannelResponse
function toChannelResponse(item: any): ChannelResponse | null {  
  if (!item || !item.sk) {  
    console.warn("Skipping invalid channel item:", item);
    return null;
  }

  return {
    id: (item.sk || "").replace("CHANNEL#", ""),  // extract ID from sort key
    name: item.name || "Unnamed channel",  // default name if missing
    ownerId: item.ownerId || "unknown",  // default owner if missing
    Guest: item.Guest ?? false, // default Guest to false if missing
  };
}
// get channel by id
router.get("/:id", async (req: Request<IdParam>, res: Response<OperationResult<ChannelResponse> | ErrorResponse>) => {
  try {
    const channelId = req.params.id;

    const result = await db.send(
      new GetCommand({
        TableName: myTable,
        Key: {
          pk: "CHANNELS",  // partition key for channels
          sk: `CHANNEL#${channelId}`, // sort key for specific channel
        },
      })
    );

    const channel: Channel | undefined = result.Item as Channel | undefined;  // cast to Channel or undefined

    if (!channel) {  // channel not found
      return res.status(404).send({
        success: false,
        error: "Channel not found",
        message: "Channel not found",
      });
    }

    const formattedChannel = toChannelResponse(channel);  // convert to ChannelResponse

    if (!formattedChannel) {  // invalid channel format
      return res.status(500).send({
        success: false,
        error: "Invalid channel format",
        message: "Channel data is invalid",
      });
    }

    res.status(200).send({
      success: true,
      message: "Channel fetched successfully",
      item: formattedChannel,
    });
  } catch (error) {
    console.error("Error fetching channel:", error);
    res.status(500).send({
      success: false,
      error: (error as Error).message,
      message: "Failed to fetch channel",
    });
  }
});

// Create new channel
router.post("/", async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;  // get authorization header
    if (!authHeader) {  // check if authorization header is missing
      return res.status(401).send({
        success: false,
        message: "Missing Authorization header",
      });
    }

    const token = authHeader.split(" ")[1];  // extract token from header
    if (!token) {  // check if token is missing
      return res.status(401).send({  
        success: false,
        message: "Missing token in Authorization header",
      });
    }

    const decoded = verifyToken(token);  // verify token
    if (!decoded) {  // check if token is invalid
      return res.status(403).send({
        success: false,
        message: "Invalid or expired token",
      });
    }

    const { name, Guest } = req.body;  // get name and Guest from request body

    if (!name) {
      return res.status(400).send({
        success: false,
        message: "Missing channel name",
      });
    }

    const id = randomUUID();  // generate unique channel ID
    const newChannel = {
      pk: "CHANNELS",  // partition key for channels
      sk: `CHANNEL#${id}`,  // sort key with channel
      id,  // unique channel ID
      name,  // channel name
      ownerId: decoded.userId, // owner comes from JWT
      Guest: Guest ?? false,  // default Guest to false if missing
      createdAt: new Date().toISOString(),  // timestamp of creation
    };

    await db.send(
      new PutCommand({  // put new channel item in DB
        TableName: myTable,  
        Item: newChannel,
      })
    );

    res.status(201).send({
      success: true,
      message: "Channel created successfully",
      item: newChannel,
    });
  } catch (error) {
    console.error("Error creating channel:", error);
    res.status(403).send({
      success: false,
      message: "Invalid or expired token",
      error: (error as Error).message,
    });
  }
});

// Delete channel
router.delete("/:id", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;  // get authorization header
    if (!authHeader) {  // check if authorization header is missing
      return res.status(401).send({
        success: false,
        message: "Missing authorization header",
      });
    }

    const token = authHeader?.split(" ")[1];  // extract token from header

    if (!token) {  // check if token is missing
      return res.status(401).send({  
      success: false,
      message: "Missing or invalid authorization token",
  });
}

    const decoded = verifyToken(token);  // verify token
    if (!decoded) {  // check if token is invalid
      return res.status(403).send({
      success: false,
      message: "Invalid or expired token",
  });
}

    const channelId = req.params.id;  // get channel ID from params

    //  Fetch the channel to verify ownership
    const result = await db.send(
      new GetCommand({  // get channel item from DB
        TableName: myTable,
        Key: {
          pk: "CHANNELS",  // partition key for channels
          sk: `CHANNEL#${channelId}`,  // sort key for specific channel
        },
      })
    );

    const channel = result.Item;  // fetched channel item
    if (!channel) {  // channel not found
      return res.status(404).send({
        success: false,
        message: "Channel not found",
      });
    }

    //  Only owner can delete
    if (channel.ownerId !== decoded.userId) {  // check ownership
      return res.status(403).send({
        success: false,
        message: "You are not authorized to delete this channel",
      });
    }

    await db.send(
      new DeleteCommand({  // delete channel item from DB
        TableName: myTable,
        Key: {  
          pk: "CHANNELS",  // partition key for channels
          sk: `CHANNEL#${channelId}`,  // sort key for specific channel
        },
      })
    );

    res.status(200).send({
      success: true,
      message: "Channel deleted successfully",
      id: channelId,
    });
  } catch (error) {
    console.error("Error deleting channel:", error);
    res.status(500).send({
      success: false,
      message: "Could not delete channel",
      error: (error as Error).message,
    });
  }
});


export default router