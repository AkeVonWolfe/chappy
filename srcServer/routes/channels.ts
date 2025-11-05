import { ScanCommand, DeleteCommand, PutCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import express from "express";
import type { Request, Response, Router } from "express";
import { db, myTable } from "../data/db.js";
import type { ErrorResponse, OperationResult, SuccessResponse, IdParam, GetResult } from "../data/types.js"


const router: Router = express.Router();


interface Channel {
    pk: string;
    sk: string;
    name: string;
}

// Get all channels
router.get("/", async (req, res: Response<SuccessResponse<Channel> | ErrorResponse>) => {
  try {
    const result: GetResult = await db.send(
      new QueryCommand({
        TableName: myTable,
        KeyConditionExpression: "begins_with(pk, :userPrefix) AND begins_with(sk, :meta)",
        ExpressionAttributeValues: {
          ":userPrefix": "CHANNEL", // all channels have pk starting with "CHANNEL"
          ":meta": "USER", // all channels meta have sk "USER"
        },
      })
    )

     // TODO: do I need to repeat this?
    res.status(200).send({
      success: true,
      count: result.Count ?? 0,
      items: result.Items ?? [],
    })
  } catch (error) {
    res.status(500).send({
      success: false,
      error: (error as Error).message,
      message: "Could not fetch channels",
    })
  }
})


// DELETE Channel by id
router.delete("/:id", async (req: Request<IdParam>, res: Response<OperationResult<Channel> | ErrorResponse>) => {
  try {
    const channelId : number = req.params.id;

    const result = await db.send(
      new DeleteCommand({
        TableName: myTable,
        Key: {
          pk: `CHANNEL#${channelId}`,
          sk: "USER", // need to get this from auth in future
        },
        ConditionExpression: "attribute_exists(pk)",
        ReturnValues: "ALL_OLD",
      })
    );

    const channelUser: Channel = result.Attributes as Channel;

    res.status(200).send({
      success: true,
      message: "Channel deleted successfully",
      item: channelUser,
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      error: (error as Error).message,
      message: "Failed to delete Channel",
    })
  }
})

// create Channel
router.post("/", async (req: Request<Channel>, res: Response<OperationResult<Channel> | ErrorResponse>) => {
  const newChannel: Channel = req.body;
  try {
    await db.send(
      new PutCommand({
        TableName: myTable,
        Item: newChannel,
      })
    )
    res.status(201).send({
      success: true,
      message: "Channel created successfully",
      item: newChannel,
    })
  } catch (error) {   
    res.status(500).send({
      success: false,
      error: (error as Error).message,
      message: "Failed to create channel",
    })
  }
})

// get channel by id
router.get("/:id", async (req: Request<IdParam>, res: Response<OperationResult<Channel> | ErrorResponse>) => {
  try {
    const channelId: number = req.params.id;
    const result = await db.send(
      new QueryCommand({
        TableName: myTable,
        KeyConditionExpression: "pk = :pk AND sk = :sk",
        ExpressionAttributeValues: {
          ":pk": `CHANNEL#${channelId}`,
          ":sk": "USER",
        }
      })
    );
    const channel: Channel | undefined = result.Items ? (result.Items[0] as Channel) : undefined;
    if (!channel) {

      return res.status(404).send({
        success: false,
        error: Error("Channel not found").message,
        message: "Channel not found",
      })
    }
    res.status(200).send({
      success: true,
      message: "Channel fetched successfully",
      item: channel,
    })
  }
  catch (error) {
    res.status(500).send({
      success: false,
      error: (error as Error).message,
      message: "Failed to fetch channel",
    })
  }
})

export default router;

