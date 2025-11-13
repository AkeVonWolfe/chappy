import { DeleteCommand, PutCommand, QueryCommand, GetCommand } from "@aws-sdk/lib-dynamodb";
import express from "express";
import type { Request, Response, Router } from "express";
import { db, myTable } from "../data/db.js";
import type { ErrorResponse, OperationResult, SuccessResponse, IdParam, GetResult } from "../data/types.js"
import { randomUUID } from "crypto";
import { ChannelCreateSchema } from "../data/validation.js";
import { verifyToken } from "../data/auth.js"

const router: Router = express.Router()


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
      new QueryCommand({
        TableName: myTable,
        KeyConditionExpression: "pk = :pk AND begins_with(sk, :skPrefix)",
        ExpressionAttributeValues: {
          ":pk": "CHANNELS",
          ":skPrefix": "CHANNEL#",
        },
      })
    );

    interface DBItem {
      pk: string;
      sk: string;
      name?: string;
      owner?: string;
      [key: string]: unknown;
    }

    const rawItems: DBItem[] = (result.Items ?? []) as DBItem[];

    const channels = (rawItems
      .map((item: DBItem) => toChannelResponse(item as Channel))
      .filter((ch) => ch !== null)) as ChannelResponse[];

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
    id: (item.sk || "").replace("CHANNEL#", ""),
    name: item.name || "Unnamed channel",
    ownerId: item.ownerId || "unknown",
    Guest: item.Guest ?? false,
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
          pk: "CHANNELS",
          sk: `CHANNEL#${channelId}`,
        },
      })
    );

    const channel: Channel | undefined = result.Item as Channel | undefined;

    if (!channel) {
      return res.status(404).send({
        success: false,
        error: "Channel not found",
        message: "Channel not found",
      });
    }

    const formattedChannel = toChannelResponse(channel);

    if (!formattedChannel) {
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
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).send({
        success: false,
        message: "Missing Authorization header",
      });
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      return res.status(401).send({
        success: false,
        message: "Missing token in Authorization header",
      });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return res.status(403).send({
        success: false,
        message: "Invalid or expired token",
      });
    }

    const { name, Guest } = req.body;

    if (!name) {
      return res.status(400).send({
        success: false,
        message: "Missing channel name",
      });
    }

    const id = randomUUID();
    const newChannel = {
      pk: "CHANNELS",
      sk: `CHANNEL#${id}`,
      id,
      name,
      ownerId: decoded.userId, // owner comes from JWT
      Guest: Guest ?? false,
      createdAt: new Date().toISOString(),
    };

    await db.send(
      new PutCommand({
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
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).send({
        success: false,
        message: "Missing authorization header",
      });
    }

    const token = authHeader?.split(" ")[1];

    if (!token) {
      return res.status(401).send({
      success: false,
      message: "Missing or invalid authorization token",
  });
}

    const decoded = verifyToken(token);
    if (!decoded) {
      return res.status(403).send({
      success: false,
      message: "Invalid or expired token",
  });
}

    const channelId = req.params.id;

    //  Fetch the channel to verify ownership
    const result = await db.send(
      new GetCommand({
        TableName: myTable,
        Key: {
          pk: "CHANNELS",
          sk: `CHANNEL#${channelId}`,
        },
      })
    );

    const channel = result.Item;
    if (!channel) {
      return res.status(404).send({
        success: false,
        message: "Channel not found",
      });
    }

    //  Only owner can delete
    if (channel.ownerId !== decoded.userId) {
      return res.status(403).send({
        success: false,
        message: "You are not authorized to delete this channel",
      });
    }

    await db.send(
      new DeleteCommand({
        TableName: myTable,
        Key: {
          pk: "CHANNELS",
          sk: `CHANNEL#${channelId}`,
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