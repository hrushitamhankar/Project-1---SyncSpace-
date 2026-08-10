import jwt from "jsonwebtoken";

export default function socketAuth(socket, next) {
    try {
        const token =
            socket.handshake.auth?.token;

        if (!token) {
            return next(
                new Error(
                    "Authentication token required"
                )
            );
        }

        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        socket.user = decoded;

        next();

    } catch (error) {
        console.error(
            "Socket authentication failed:",
            error.message
        );

        next(
            new Error(
                "Invalid or expired token"
            )
        );
    }
}