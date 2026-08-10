import jwt from "jsonwebtoken";

export default function socketAuth(socket, next) {

    try {

        const token =
            socket.handshake.auth?.token ||
            socket.handshake.headers?.authorization?.replace(
                "Bearer ",
                ""
            );

        if (!token) {
            return next(
                new Error("Authentication required")
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
            "[SOCKET AUTH ERROR]",
            error.message
        );

        next(
            new Error("Invalid or expired token")
        );
    }
}