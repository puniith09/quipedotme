import { redirect } from 'next/navigation';
import { auth } from '@/app/(auth)/auth';
import { UserProfile } from '@/components/user-profile';
import { getUserWithProfile } from '@/lib/db/queries';

export default async function MyProfilePage() {
  const session = await auth();
  
  if (!session?.user?.id) {
    redirect('/login');
  }
  
  try {
    const userWithProfile = await getUserWithProfile(session.user.id);
    
    if (!userWithProfile) {
      redirect('/login');
    }
    
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto py-8">
          <UserProfile user={userWithProfile} isOwnProfile={true} />
        </div>
      </div>
    );
  } catch (error) {
    console.error('Error loading profile:', error);
    redirect('/login');
  }
}