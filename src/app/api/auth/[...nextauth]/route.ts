//'use client'
import NextAuth from 'next-auth'
import GithubProvider from 'next-auth/providers/github'
import GoogleProvider from 'next-auth/providers/google'
import CredentialsProvider from 'next-auth/providers/credentials'

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
        // Add your own authentication logic here
        // This is just a placeholder - implement your actual auth logic
        if (credentials?.email && credentials?.password) {
          // Validate credentials against your database
          // Return user object if valid, null if invalid
          return {
            id: '1',
            email: credentials.email,
            name: 'User Name',
          }
        }
        return null
      }
    })
  ],
  pages: {
    signIn: '/api/auth/signIn', // Optional: custom sign-in page
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