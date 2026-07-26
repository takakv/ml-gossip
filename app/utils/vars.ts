export const cdnPrefix = "https://merelaager.b-cdn.net/gossip/";

export const streamLibraryId = "712623";
export const streamEmbedPrefix = `https://iframe.mediadelivery.net/embed/${streamLibraryId}/`;

const streamPullZone = "https://vz-4e9ce9c7-fb3.b-cdn.net";
export const streamThumbnail = (videoId: string) =>
  `${streamPullZone}/${videoId}/thumbnail.jpg`;
