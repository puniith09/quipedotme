import { notFound } from 'next/navigation';
import { UserProfile } from '@/components/user-profile';
import { getUserWithProfile, getUserByUsername } from '@/lib/db/queries';

interface ProfilePageProps {
  params: {
    username: string;
  };
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { username } = params;
  
  try {
    const [userByUsername] = await getUserByUsername(username);
    
    if (!userByUsername) {
      notFound();
    }
    
    const userWithProfile = await getUserWithProfile(userByUsername.id);
    
    if (!userWithProfile) {
      notFound();
    }
    
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto py-8">
          <UserProfile user={userWithProfile} />
        </div>
      </div>
    );
  } catch (error) {
    console.error('Error loading profile:', error);
    notFound();
  }
}

export async function generateMetadata({ params }: ProfilePageProps) {
  const { username } = params;
  
  try {
    const [user] = await getUserByUsername(username);
    
    if (!user) {
      return {
        title: 'Profile Not Found',
      };
    }
    
    const displayName = user.displayName || user.username;
    
    return {
      title: `${displayName} (@${user.username})`,
      description: user.bio || `Check out ${displayName}'s profile`,
    };
  } catch (error) {
    return {
      title: 'Profile Not Found',
    };
  }
}