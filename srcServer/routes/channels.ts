import { DeleteCommand, PutCommand, QueryCommand, GetCommand } from "@aws-sdk/lib-dynamodb";
import express from "express";
import type { Request, Response, Router } from "express";
import { db, myTable } from "../data/db.js";
import type { ErrorResponse, OperationResult, SuccessResponse, IdParam, GetResult } from "../data/types.js"
import { randomUUID } from "crypto";
import { ChannelCreateSchema } from "../data/validation.js";


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
}

// Generate a unique channel ID
function generateChannelId(): string {
  return randomUUID()
}

// Convert Channel to ChannelResponse
function toChannelResponse(channel: Channel): ChannelResponse {
  return {
    id: channel.sk.replace("CHANNEL#", ""),
    name: channel.name,
    ownerId: channel.owner.replace("USER#", ""),
  }
}

// get all channels
router.get("/", async (req, res: Response<SuccessResponse<ChannelResponse> | ErrorResponse>) => {
  try {
    // Use Query to get all channels with pk = "CHANNELS"
    const result: GetResult = await db.send(
      new QueryCommand({
        TableName: myTable,
        KeyConditionExpression: "pk = :pk",
        ExpressionAttributeValues: {
          ":pk": "CHANNELS",
        },
      })
    )

    // interface to prevent from being Any
    interface DBItem {
      pk: string
      sk: string
      name?: string
      owner?: string
      [key: string]: unknown
    }

    const rawItems: DBItem[] = (result.Items ?? []) as DBItem[]

    const channels: ChannelResponse[] = rawItems.map((item: DBItem) =>
      toChannelResponse(item as Channel)
    )

    res.status(200).send({
      success: true,
      count: channels.length,
      items: channels,
    })
  } catch (error) {
    console.error("Error fetching channels:", error)
    res.status(500).send({
      success: false,
      error: (error as Error).message,
      message: "Could not fetch channels",
    })
  }
})

// get channel by id
router.get("/:id", async (req: Request<IdParam>, res: Response<OperationResult<ChannelResponse> | ErrorResponse>) => {
  try {
    const channelId = req.params.id

    // Use GetCommand since we know both pk and sk
    const result = await db.send(
      new GetCommand({
        TableName: myTable,
        Key: {
          pk: "CHANNELS",
          sk: `CHANNEL#${channelId}`,
        },
      })
    )

    const channel: Channel | undefined = result.Item as Channel | undefined

    if (!channel) {
      return res.status(404).send({
        success: false,
        error: "Channel not found",
        message: "Channel not found",
      })
    }

    res.status(200).send({
      success: true,
      message: "Channel fetched successfully",
      item: toChannelResponse(channel),
    })
  } catch (error) {
    console.error("Error fetching channel:", error)
    res.status(500).send({
      success: false,
      error: (error as Error).message,
      message: "Failed to fetch channel",
    })
  }
})

// Create new channel
router.post("/", async (req: Request, res: Response<OperationResult<ChannelResponse> | ErrorResponse>) => {
  // Validate input
  const validationResult = ChannelCreateSchema.safeParse(req.body)

  if (!validationResult.success) {
    const errors = validationResult.error.issues.map((err) => ({
      field: err.path.join("."),
      message: err.message,
    }))

    return res.status(400).send({
      success: false,
      message: "Invalid channel data",
      error: errors,
    })
  }

  const { name, userId }: ChannelCreateInput = validationResult.data

  // TODO: Get userId from authentication middleware instead of request body
  if (!userId) {
    return res.status(400).send({
      success: false,
      message: "userId is required",
      error: "User authentication required",
    })
  }

  try {
    // Generate unique channel ID
    const channelId = generateChannelId()

    // Create channel object
    const newChannel: Channel = {
      pk: "CHANNELS",
      sk: `CHANNEL#${channelId}`,
      name,
      owner: `USER#${userId}`,
    }

    // Save to database
    await db.send(
      new PutCommand({
        TableName: myTable,
        Item: newChannel,
        ConditionExpression: "attribute_not_exists(sk)",
      })
    )

    res.status(201).send({
      success: true,
      message: "Channel created successfully",
      item: toChannelResponse(newChannel),
    })
  } catch (error) {
    console.error("Error creating channel:", error)
    res.status(500).send({
      success: false,
      error: (error as Error).message,
      message: "Failed to create channel",
    })
  }
})

// Delete channel
router.delete("/:id", async (req: Request<IdParam>, res: Response<OperationResult<ChannelResponse> | ErrorResponse>) => {
  try {
    const channelId = req.params.id
    
    // TODO: Get userId from authentication middleware
    const { userId } = req.body

    if (!userId) {
      return res.status(401).send({
        success: false,
        message: "Authentication required",
        error: "userId is required to delete a channel",
      })
    }

    // Fetch the channel to verify ownership
    const getResult = await db.send(
      new GetCommand({
        TableName: myTable,
        Key: {
          pk: "CHANNELS",
          sk: `CHANNEL#${channelId}`,
        },
      })
    )

    const existingChannel = getResult.Item as Channel | undefined

    if (!existingChannel) {
      return res.status(404).send({
        success: false,
        message: "Channel not found",
        error: "Channel does not exist",
      })
    }

    // verify ownership
    const ownerId = existingChannel.owner.replace("USER#", "")
    if (ownerId !== userId) {
      return res.status(403).send({
        success: false,
        message: "Forbidden",
        error: "You can only delete channels you created",
      })
    }

    // Delete the channel
    const deleteResult = await db.send(
      new DeleteCommand({
        TableName: myTable,
        Key: {
          pk: existingChannel.pk,
          sk: existingChannel.sk,
        },
        ConditionExpression: "attribute_exists(sk)",
        ReturnValues: "ALL_OLD",
      })
    )

    const deletedChannel: Channel = deleteResult.Attributes as Channel

    res.status(200).send({
      success: true,
      message: "Channel deleted successfully",
      item: toChannelResponse(deletedChannel),
    })
  } catch (error) {
    console.error("Error deleting channel:", error)
    res.status(500).send({
      success: false,
      error: (error as Error).message,
      message: "Failed to delete channel",
    })
  }
})

export default router;