// Server-side authentication utilities
import { NextRequest } from "next/server";
import { connectDB } from "@/lib/mongoose";
import { User } from "@/models/User";

// Simple token validation - checks if user exists by email from token
export async function validateAuth(request: NextRequest): Promise<{ isValid: boolean; userId?: string; email?: string }> {
  try {
    // Get authorization header
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { isValid: false };
    }

    // Extract token (format: Bearer base64(email:timestamp))
    const token = authHeader.substring(7);
    
    try {
      const decoded = Buffer.from(token, 'base64').toString('utf-8');
      const [email, timestamp] = decoded.split(':');
      
      if (!email || !timestamp) {
        return { isValid: false };
      }

      // Check if token is not expired (24 hours)
      const tokenTime = parseInt(timestamp);
      const now = Date.now();
      const hoursDiff = (now - tokenTime) / (1000 * 60 * 60);
      
      if (hoursDiff > 24) {
        return { isValid: false };
      }

      // Verify user exists
      await connectDB();
      const user = await User.findOne({ email: email.toLowerCase() });
      
      if (!user) {
        return { isValid: false };
      }

      return { 
        isValid: true, 
        userId: user._id.toString(),
        email: user.email 
      };
    } catch (decodeError) {
      return { isValid: false };
    }
  } catch (error) {
    console.error('Auth validation error:', error);
    return { isValid: false };
  }
}

// Generate auth token
export function generateAuthToken(email: string): string {
  const timestamp = Date.now();
  const token = Buffer.from(`${email}:${timestamp}`).toString('base64');
  return token;
}
