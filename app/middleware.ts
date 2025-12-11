import { withAuth } from "next-auth/middleware";

export default withAuth({
  callbacks: {
    authorized({ token }) {
      return token?.email === process.env.ADMIN_EMAIL;
    }
  }
});

export const config = {
  matcher: ["/dashboard/:path*"]
};
