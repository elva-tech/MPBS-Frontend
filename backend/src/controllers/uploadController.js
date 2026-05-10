import { uploadToS3 } from "../utils/s3.js";
import crypto from "crypto";

export async function uploadNotificationAttachment(req, res) {
  if (!req.file) {
    return res.status(400).json({ message: "No file uploaded" });
  }

  const ext = req.file.originalname.includes(".")
    ? req.file.originalname.split(".").pop()
    : "bin";
  const key = `notifications/${Date.now()}-${crypto.randomUUID()}.${ext}`;

  const url = await uploadToS3({
    key,
    body: req.file.buffer,
    contentType: req.file.mimetype,
  });

  res.status(201).json({ url, key, name: req.file.originalname });
}

export async function uploadComplaintAttachment(req, res) {
  if (!req.file) {
    return res.status(400).json({ message: "No file uploaded" });
  }

  const ext = req.file.originalname.includes(".")
    ? req.file.originalname.split(".").pop()
    : "bin";
  const key = `complaints/${Date.now()}-${crypto.randomUUID()}.${ext}`;

  const url = await uploadToS3({
    key,
    body: req.file.buffer,
    contentType: req.file.mimetype,
  });

  res.status(201).json({ url, key, name: req.file.originalname });
}
