import express from "express";
import type { Request, Response, Router } from "express";
import { db, myTable } from "../data/db.js";
import { messageSchema, UserSchema } from "../data/validation.js"
import type { ErrorResponse, OperationResult } from "../data/types.js";
import { PutCommand } from "@aws-sdk/lib-dynamodb";

const router: Router = express.Router()


interface Message {
    message: string

}

interface User {
  pk: string;
  sk: string;
  name: string;
}


// message in Channel

router.post("/:id", async (req: Request<Message>, res: Response<OperationResult<Message> | ErrorResponse>) => {
  
     // TODO : put valdiaton as middleware?
    let validateResualt = messageSchema.safeParse(req.body)
    
    if (!validateResualt.success) {
        const errors = validateResualt.error.issues.map((err) => ({
            field: err.path.join("."),
            message: err.message,
        }))
        return res.status(400).send({
            success: false,
            message: "Invalid message body",
            error: errors,
        })
    }
    
    
    const newMessage: Message = validateResualt.data
    
    try {
      await db.send(
          new PutCommand({
              TableName: myTable,
              Item: newMessage,
              
          })
      )
      res.status(201).send({
          success: true,
          message: "message sent successfully",
          item: newMessage,
      })
    } catch (error) {
      res.status(500).send({
          success:false,
          error: (error as Error).message,
          message: "could not post message"
      })
    }
})

// message user to user





export default router