import { redirect } from 'next/navigation';

export default function LandingPage() {
  // Always route through the local login page so the app can generate
  // state/PKCE and control the callback URI used for local development.
  redirect('/login');
}
