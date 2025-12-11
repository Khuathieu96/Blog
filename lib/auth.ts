import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || ""
    })
  ],
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async signIn({ user }) {
      // ONLY allow your email
      return user.email === (process.env.ADMIN_EMAIL || "");
    }
  }
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST, authOptions };
