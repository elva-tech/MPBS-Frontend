import { uploadToS3 } from "../utils/s3.js";
import crypto from "crypto";
import path from "path";
import { promises as fs } from "fs";
import { config } from "../config/env.js";

function buildAttachmentExt(originalName) {
  const parsed = path.extname(originalName || "").toLowerCase();
  if (!parsed || parsed.length > 12) return ".bin";
  return parsed;
}

async function uploadToLocalDisk({ key, body }) {
  const uploadsRoot = path.resolve(process.cwd(), "public", "uploads");
  const fullPath = path.join(uploadsRoot, key);
  await fs.mkdir(path.dirname(fullPath), { recursive: true });
  await fs.writeFile(fullPath, body);
}

export async function uploadNotificationAttachment(req, res) {
  if (!req.file) {
    return res.status(400).json({ message: "No file uploaded" });
  }

  const ext = buildAttachmentExt(req.file.originalname);
  const key = `notifications/${Date.now()}-${crypto.randomUUID()}${ext}`;
  const hasS3Config = Boolean(config.aws.s3Bucket && config.aws.region);

  let url;
  if (hasS3Config) {
    url = await uploadToS3({
      key,
      body: req.file.buffer,
      contentType: req.file.mimetype || "application/octet-stream",
    });
  } else {
    await uploadToLocalDisk({ key, body: req.file.buffer });
    url = `${req.protocol}://${req.get("host")}/files/${key}`;
  }

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
