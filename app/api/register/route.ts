import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import { Register } from "@/models/Register";
import { validateAuth } from "@/lib/auth-utils";

export async function POST(req: Request) {
  try {
    await connectDB();
    const body = await req.json();
    const { name, email } = body;

    if (!name || !email) {
      return NextResponse.json(
        { error: "Name and email are required" },
        { status: 400 }
      );
    }

    // Check if email already registered
    const existing = await Register.findOne({ email: email.toLowerCase() });
    if (existing) {
      return NextResponse.json(
        { error: "This email has already requested registration" },
        { status: 409 }
      );
    }

    // Create registration request
    const registration = await Register.create({
      name,
      email: email.toLowerCase(),
    });

    return NextResponse.json({
      message: "Registration request submitted successfully",
      registration: {
        id: registration._id,
        name: registration.name,
        email: registration.email,
      },
    });
  } catch (error) {
    console.error("Registration request failed:", error);
    return NextResponse.json(
      { error: "Failed to submit registration request" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    // Validate authentication - only authenticated users can view registrations
    const auth = await validateAuth(req);
    if (!auth.isValid) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    await connectDB();
    const registrations = await Register.find().sort({ createdAt: -1 });
    return NextResponse.json(registrations);
  } catch (error) {
    console.error("Failed to fetch registrations:", error);
    return NextResponse.json(
      { error: "Failed to fetch registration requests" },
      { status: 500 }
    );
  }
}
