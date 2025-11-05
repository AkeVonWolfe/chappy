import {  ScanCommand, DeleteCommand, UpdateCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import express from "express";
import type { Request, Response, Router } from "express";
import { db, myTable } from "../data/db.js";
import type { ErrorResponse, OperationResult, SuccessResponse, IdParam, GetResult } from "../data/types.js"


const router: Router = express.Router()


interface User {
    pk: string
    sk: string
    name: string
}

// Get all users
router.get("/", async (req, res: Response<SuccessResponse<User> | ErrorResponse>) => {
  try {
    const result: GetResult = await db.send(
      new QueryCommand({  //TODO: Change to queary due to message gonna flood DB
        // ScanCommand to get entire table
        TableName: myTable,
        KeyConditionExpression: "pk = :pk AND begins_with(sk, :skPrefix)", // filter for users only
        ExpressionAttributeValues: {
          ":pk": "USERS",
          ":skPrefix": "META",
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
    const userId : number = req.params.id

    const result = await db.send(
      new DeleteCommand({
        TableName: myTable,
        Key: {
          sk: "USERS",
          pk: `USER#${userId}`,
        },
        ConditionExpression: "attribute_exists(pk)",
        ReturnValues: "ALL_OLD",
      })
    )

    const deletedUser: User = result.Attributes as User

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

// Login user
router.post("/login", async (req: Request<User>, res: Response<OperationResult<User> | ErrorResponse>) => {
  const { userId, name, password } = req.body
  try {
    const result = await db.send(
      new UpdateCommand({
        TableName: myTable,
        Key: {
          pk: "USERS",
          sk: `USER#${userId}`,
        },
        UpdateExpression: "SET #name = :name",
        ExpressionAttributeNames: {
          "#name": "name",
        },
        ExpressionAttributeValues: {
          ":name": name,
          ":password": password,
        },
        ConditionExpression: "attribute_exists(pk) AND password = :password",
        ReturnValues: "ALL_NEW",
      })
    )

    const updatedUser: User = result.Attributes as User

    res.status(200).send({
      success: true,
      message: "User logged in successfully",
      item: updatedUser,
    })
  } catch (error) {
    res.status(500).send({
      success: false,
      error: (error as Error).message,
      message: "Failed to log in user",
    })
  }  
})

export default router