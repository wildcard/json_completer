import type { NextApiRequest, NextApiResponse } from 'next';
import { JsonCompleterClient } from '../../../shared/json-completer-client';

type ResponseData = {
  success: boolean;
  result?: string;
  error?: string;
};

/**
 * Next.js API route for JSON completion using the Rust binary
 *
 * POST /api/complete-json
 * Body: { partialJson: string }
 *
 * Example usage:
 * fetch('/api/complete-json', {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify({ partialJson: '{"test":' })
 * });
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed',
    });
  }

  const { partialJson } = req.body;

  // Validate input
  if (partialJson === undefined || partialJson === null) {
    return res.status(400).json({
      success: false,
      error: 'Missing partialJson field in request body',
    });
  }

  if (typeof partialJson !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'partialJson must be a string',
    });
  }

  try {
    // Create a new client for this request
    const client = new JsonCompleterClient();
    const result = await client.complete(partialJson);

    return res.status(200).json({
      success: true,
      result,
    });
  } catch (error: any) {
    console.error('JSON completion error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to complete JSON',
    });
  }
}
