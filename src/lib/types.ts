export type ChatSlot = 0 | 1 | 2 | 3;
export type Mode = "keyboard" | "sticker";
export type PickTarget = "background" | "chatImage1" | "chatImage2" | "chatImage3" | "chatImage4";
/** Which pre-made storyline is filling chatImage2/3/4 by default — only
 *  matters for slots the user hasn't uploaded their own image into. */
export type ChatSet = "A" | "B";

export type Sticker = {
  id: number;
  url: string;
};
