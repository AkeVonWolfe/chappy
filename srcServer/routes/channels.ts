import { ScanCommand, DeleteCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
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
      new ScanCommand({  //TODO: change to queary due to flood of message in DB
        // ScanCommand to get entire table
        TableName: myTable,
        FilterExpression: "begins_with(pk, :userPrefix) AND begins_with(sk, :meta)", // filter for channels only
        ExpressionAttributeValues: {
          ":userPrefix": "CHANNEL", // all channels have pk starting with "CHANNEL"
          ":meta": "META", // all channels meta have sk "meta"
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
          sk: "META",
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

export default router;

