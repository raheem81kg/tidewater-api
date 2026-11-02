import cors from "cors";
import express from "express";

import { ENV } from "./env.server";

export const app = express();

app.use(
  cors({
    origin: ENV.CORS_ORIGIN,
    methods: ["GET", "OPTIONS"],
  }),
);

app.use(express.json());

const TOURS = [
  { id: "harbour-sunset", name: "Harbour Sunset Cruise", capacity: 40, price: 59 },
  { id: "marsh-kayak", name: "Marsh & Estuary Kayak", capacity: 12, price: 85 },
  { id: "lighthouse-walk", name: "Lighthouse Point Walk", capacity: 25, price: 35 },
];

app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

app.get("/", (_req, res) => {
  res.status(200).send("Tidewater Tours API");
});

app.get("/api/tours", (_req, res) => {
  res.status(200).json(TOURS);
});

app.get("/api/tours/:id", (req, res) => {
  const tour = TOURS.find((each) => each.id === req.params.id);
  if (!tour) {
    res.status(404).json({ error: "Tour not found" });
    return;
  }
  res.status(200).json(tour);
});
