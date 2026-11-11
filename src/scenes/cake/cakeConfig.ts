/**
 * Everything the cake scene plays or shows. The admin panel will later replace these values with uploaded files;
 * until then the scene uses the video and table photo you provided.
 */
export const cakeConfig = {
  /** The cake-making video, played full screen. */
  videoSrc: "/cake/cake-making.mp4",
  videoPoster: "/cake/cake-poster.jpg",
  /** The decorated party table the 3D cake is placed on. */
  tableImage: "/cake/party-table.jpg",
  /**
   * Your recorded "Happy Birthday" voice. Leave empty until you upload it: a gentle synthesised
   * "Happy Birthday" melody plays instead so the celebration is never silent.
   */
  birthdayAudioUrl: "",
  hintText: "Knife par tap karo",
  readyLine: "Candles jal gayi… ab cake kaatne ki baari!",
  celebrateTitle: "Happy Birthday",
  celebrateLine: "Make a wish, my love ✨",
} as const;
