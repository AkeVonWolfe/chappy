import jwt from 'jsonwebtoken';

const JWT_SECRET: string = process.env.JWT_SECRET || 'your_jwt_secret';

function CreateJWTtoken(userId: string, guest: boolean) {

    return jwt.sign(
        {
            userId: userId,
            guest: guest,
        },
        JWT_SECRET,
        { expiresIn: '30m' }
    )
}


export { CreateJWTtoken }