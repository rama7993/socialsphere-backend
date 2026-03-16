/**
 * Helper to determine if a request origin is allowed by CORS.
 * Supports the frontend URL from environment variables and common local development ports.
 */
export const corsOriginHelper = (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
  const allowedOrigins = [
    process.env.FRONTEND_URL,
    'http://localhost:5173',
    'http://localhost:3000',
  ].filter(Boolean);

  if (
    !origin ||
    allowedOrigins.includes(origin) ||
    allowedOrigins.includes(origin + '/')
  ) {
    callback(null, true);
  } else {
    callback(new Error('Not allowed by CORS'));
  }
};
