import sharp from "sharp";

const SHARE_W = 1200;
const SHARE_H = 630;

/**
 * Format a picture for link previews (WhatsApp, iMessage, Slack…): 1200x630 (1.91:1) JPEG, kept
 * small enough that WhatsApp doesn't drop it. Near-1.91:1 pictures fill the frame; anything else
 * is shown whole on a blurred copy of itself so nothing important gets cropped.
 */
export async function toShareImage(input: Buffer) {
  const src = sharp(input, { failOn: "none", limitInputPixels: 50_000_000 }).rotate().flatten({ background: "#ffffff" });
  const { width = 0, height = 0 } = await src.metadata();
  if (!width || !height) throw new Error("bad image");
  const ratio = width / height;
  const target = SHARE_W / SHARE_H;
  const jpeg = { quality: 82, mozjpeg: true } as const;

  if (Math.abs(ratio / target - 1) < 0.06) {
    return src.resize(SHARE_W, SHARE_H, { fit: "cover" }).jpeg(jpeg).toBuffer();
  }
  const backdrop = await src.clone().resize(SHARE_W, SHARE_H, { fit: "cover" }).blur(40).modulate({ brightness: 0.9 }).toBuffer();
  const front = await src.clone().resize(SHARE_W, SHARE_H, { fit: "inside" }).toBuffer();
  return sharp(backdrop).composite([{ input: front, gravity: "centre" }]).jpeg(jpeg).toBuffer();
}
