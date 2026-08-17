import express from "express";
import cors from "cors";
import routes from "./routes";
import { errorHandler } from "./middleware/error.middleware";

const app = express();

app.use(cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/api/v1", routes);


app.use(errorHandler);

export default app;