'use client';

import { UserWithProfile } from '@/lib/types';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { ExternalLink, MapPin, Calendar, Edit } from 'lucide-react';
import Link from 'next/link';

interface UserProfileProps {
  user: UserWithProfile;
  isOwnProfile?: boolean;
}

const platformIcons: { [key: string]: string } = {
  twitter: '🐦',
  instagram: '📷',
  tiktok: '🎵',
  youtube: '📺',
  linkedin: '💼',
  github: '💻',
  twitch: '🎮',
  discord: '💬',
  website: '🌐',
  blog: '📝',
  portfolio: '💼',
  facebook: '👥',
  snapchat: '👻',
  pinterest: '📌',
  other: '🔗'
};

export function UserProfile({ user, isOwnProfile = false }: UserProfileProps) {
  const displayName = user.displayName || user.username || 'User';
  
  return (
    <div className="max-w-2xl mx-auto p-4 space-y-6">
      {/* Profile Header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col items-center text-center space-y-4">
            {/* Profile Picture */}
            <div className="relative">
              {user.profilePicture ? (
                <img
                  src={user.profilePicture}
                  alt={`${displayName}'s profile`}
                  className="w-24 h-24 rounded-full object-cover border-4 border-background shadow-lg"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold">
                  {displayName.charAt(0).toUpperCase()}
                </div>
              )}
              {isOwnProfile && (
                <Button
                  size="sm"
                  variant="outline"
                  className="absolute -bottom-1 -right-1 rounded-full w-8 h-8 p-0"
                >
                  <Edit className="w-3 h-3" />
                </Button>
              )}
            </div>

            {/* Name and Username */}
            <div>
              <h1 className="text-2xl font-bold text-foreground">{displayName}</h1>
              <p className="text-muted-foreground">@{user.username}</p>
            </div>

            {/* Bio */}
            {user.bio && (
              <p className="text-center text-foreground max-w-md">{user.bio}</p>
            )}

            {/* Join Date */}
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Calendar className="w-4 h-4" />
              <span>Joined {new Date(user.createdAt).toLocaleDateString('en-US', { 
                month: 'long', 
                year: 'numeric' 
              })}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Photos Grid */}
      {user.photos && user.photos.length > 0 && (
        <Card>
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              📸 Photos
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {user.photos
                .sort((a, b) => parseInt(a.order) - parseInt(b.order))
                .map((photo, index) => (
                  <div key={photo.id} className="relative group">
                    <img
                      src={photo.photoUrl}
                      alt={`Photo ${index + 1}`}
                      className="w-full h-48 object-cover rounded-lg shadow-md group-hover:shadow-lg transition-shadow"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-opacity rounded-lg" />
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Social Links */}
      {user.socialLinks && user.socialLinks.length > 0 && (
        <Card>
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              🔗 Links
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {user.socialLinks
                .sort((a, b) => parseInt(a.order) - parseInt(b.order))
                .map((link) => (
                  <Link
                    key={link.id}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group"
                  >
                    <div className="flex items-center gap-3 p-3 rounded-lg border hover:border-primary transition-colors group-hover:bg-accent/50">
                      <span className="text-xl">
                        {platformIcons[link.platform.toLowerCase()] || platformIcons.other}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground group-hover:text-primary transition-colors">
                          {link.displayText || link.platform}
                        </p>
                        <p className="text-sm text-muted-foreground truncate">
                          {link.url.replace(/^https?:\/\//, '').replace(/^www\./, '')}
                        </p>
                      </div>
                      <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                  </Link>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {(!user.photos || user.photos.length === 0) && 
       (!user.socialLinks || user.socialLinks.length === 0) && 
       !user.bio && (
        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-muted-foreground">
              <p className="text-lg mb-2">✨ Profile is getting started</p>
              <p className="text-sm">
                {isOwnProfile 
                  ? "Add some photos, links, and a bio to make your profile shine!"
                  : `${displayName} is setting up their profile.`
                }
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Edit Profile Button for Own Profile */}
      {isOwnProfile && (
        <div className="flex justify-center">
          <Button variant="outline" className="flex items-center gap-2">
            <Edit className="w-4 h-4" />
            Edit Profile
          </Button>
        </div>
      )}
    </div>
  );
}