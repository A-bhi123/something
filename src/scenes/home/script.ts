import type { Beat } from "@/animation";

/** What the character says, in order. `pause` is a silent beat where he just smiles. */
export const welcomeScript: readonly Beat[] = [
  { say: "Heyyy... Birthday Girl! 🌸", wave: true, hold: 900 },
  { say: "Finally... you're here!", wave: true, hold: 900 },
  { say: "Main kab se tumhara intezaar kar raha tha.", hold: 1100 },
  { say: "Lekin ek baat bataun?", hold: 1000 },
  { say: "Tumhe shayad lag raha hoga ki tum kisi normal website par aayi ho...", hold: 1200 },
  { pause: 2200, mood: "smile" },
  { say: "Lekin nahi...", hold: 1000 },
  { say: "Yeh jagah sirf tumhare liye banayi gayi hai.", mood: "smile", hold: 1300 },
  {
    say: "Yahan kuch yaadein hain, kuch unsaid feelings hain... aur ek aisi kahani hai jiska sabse khoobsurat hissa tum ho.",
    hold: 1800,
  },
  { say: "So... are you ready to discover something special?", mood: "smile", hold: 400 },
];
