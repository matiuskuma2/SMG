declare namespace NodeJS {
  interface ProcessEnv {
    VIMEO_CLIENT_ID: string;
    VIMEO_CLIENT_SECRET: string;
    VIMEO_ACCESS_TOKEN: string;
    SENDGRID_API_KEY: string;
    SENDGRID_SENDER_EMAIL: string;
    NEXT_PUBLIC_FRONT_URL: string;
    [key: string]: string | undefined;
  }
}
