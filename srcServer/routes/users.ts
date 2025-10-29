import {  ScanCommand, DeleteCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import express from "express";
import type { Request, Response, Router } from "express";
import { db, myTable } from "../data/db.js";
import type { ErrorResponse, OperationResult, SuccessResponse, IdParam, GetResult } from "../data/types.js"


const router: Router = express.Router();


interface User {
    pk: string;
    sk: string;
    name: string;
}

// Get all users
router.get("/", async (req, res: Response<SuccessResponse<User> | ErrorResponse>) => {
  try {
    const result: GetResult = await db.send(
      new ScanCommand({  //TODO: Change to queary due to message gonna flood DB
        // ScanCommand to get entire table
        TableName: myTable,
        FilterExpression: "begins_with(pk, :userPrefix) AND begins_with(sk, :meta)", // filter for users only
        ExpressionAttributeValues: {
          ":userPrefix": "USER", // all users have pk starting with "user"
          ":meta": "META", // all user meta have sk "meta"
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
      message: "Could not fetch users",
    })
  }
})


// DELETE user by id
router.delete("/:id", async (req: Request<IdParam>, res: Response<OperationResult<User> | ErrorResponse>) => {
  try {
    const userId : number = req.params.id;

    const result = await db.send(
      new DeleteCommand({
        TableName: myTable,
        Key: {
          pk: `USER#${userId}`,
          sk: "META",
        },
        ConditionExpression: "attribute_exists(pk)",
        ReturnValues: "ALL_OLD",
      })
    )

    const deletedUser: User = result.Attributes as User;

    res.status(200).send({
      success: true,
      message: "User deleted successfully",
      item: deletedUser,
    })
  } catch (error) {
    res.status(500).send({
      success: false,
      error: (error as Error).message,
      message: "Failed to delete user",
    })
  }
})

export default router