//'use client'
import NextAuth from 'next-auth'
import GithubProvider from 'next-auth/providers/github'
import GoogleProvider from 'next-auth/providers/google'
import CredentialsProvider from 'next-auth/providers/credentials'
import { verifyPass } from '@/app/components/server/db'


const handler = NextAuth({
  providers: [
    GithubProvider({
      clientId: process.env.GITHUB_ID!,
      clientSecret: process.env.GITHUB_SECRET!,
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    // Optional: Add credentials provider for email/password
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        try{
          if (credentials) {
          const user = await verifyPass({
            email: credentials.email,
            password: credentials.password
          });
          // Ensure only User or null is returned
          if (user) {
            // Make sure to return an object with at id, email, and optionally name/image
            return {
              id: user.id,
              email: user.email,
              name: user.name,
            };
          }
          return null;
        }
        return null;

        }catch(error){
          throw new Error(error instanceof Error ? error.message : String(error));
        }
        
      }
    })
  ],
  pages: {
    signIn: '/',
    error: '/', // Error page URL
  },
  callbacks: {
    async session({ session, token }) {
      // Add custom session logic here if needed
      return session
    },
    async jwt({ token, user }) {
      // Add custom JWT logic here if needed
      return token
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
})

export { handler as GET, handler as POST }