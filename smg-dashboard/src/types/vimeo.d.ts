declare module '@vimeo/vimeo' {
  class Vimeo {
    constructor(clientId: string, clientSecret: string, accessToken: string);

    upload(
      fileBuffer: Buffer,
      options: {
        name: string;
        description: string;
        privacy: { view: string };
        [key: string]: string | { view: string } | unknown;
      },
      onSuccess: (uri: string) => void,
      onProgress: (bytesUploaded: number, bytesTotal: number) => void,
      onError: (error: Error) => void,
    ): void;
  }

  export default Vimeo;
}
