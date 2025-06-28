//'use client'
import NextAuth from 'next-auth'
import GithubProvider from 'next-auth/providers/github'
import GoogleProvider from 'next-auth/providers/google'
import CredentialsProvider from 'next-auth/providers/credentials'
import { verifyPass, createOrUpdateOAuthUser } from '@/app/components/server/db'


const handler = NextAuth({
  providers: [
    GithubProvider({
      clientId: process.env.GITHUB_ID!,
      clientSecret: process.env.GITHUB_SECRET!,
    }),
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
    signIn: '/'
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      try {
        // For OAuth providers (GitHub, Google, etc.), create/update user in database
        if (account?.provider === 'github' || account?.provider === 'google') {
          if (user.email) {
            const result = await createOrUpdateOAuthUser(
              user.email,
              user.name || profile?.name,
              account.provider
            );
            
            if (result.success) {
              console.log(
                result.created 
                  ? `Created new OAuth user: ${user.email}` 
                  : `Updated OAuth user: ${user.email}`
              );
              return true;
            } else {
              console.error('Failed to create/update OAuth user:', user.email);
              return false;
            }
          }
        }
        
        // For credentials provider, user is already verified
        return true;
      } catch (error) {
        console.error('SignIn callback error:', error);
        return false;
      }
    },
    async session({ session, token }) {
      try {
        if (session.user) {
          //session.user.id = token.id;
          session.user.name = token.name;
          session.user.email = token.email;
        }
        return session;
      } catch (error) {
        console.error("Session callback error:", error);
        throw error;
      }
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.name = user.name;
        token.email = user.email;
      }
      return token;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
})



export { handler as GET, handler as POST }