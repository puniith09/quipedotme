'use client';

import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Plus, X, Upload, User, Camera, Link, Loader2 } from 'lucide-react';
import Form from 'next/form';
import { uploadToCloudflareImages } from '@/lib/cloudflare-images';

interface Photo {
  url: string;
  order: string;
  file?: File;
}

interface SocialLink {
  platform: string;
  url: string;
  displayText: string;
  order: string;
}

interface EnhancedRegisterFormProps {
  action: (formData: FormData) => void | Promise<void>;
  children: React.ReactNode;
  defaultEmail?: string;
}

const socialPlatforms = [
  'Instagram',
  'Twitter',
  'LinkedIn',
  'TikTok',
  'YouTube',
  'Website',
  'Facebook',
  'Snapchat',
  'Pinterest',
  'Other'
];

export function EnhancedRegisterForm({
  action,
  children,
  defaultEmail = '',
}: EnhancedRegisterFormProps) {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);
  const [profilePicture, setProfilePicture] = useState<string>('');
  const [currentStep, setCurrentStep] = useState(1);
  const [uploading, setUploading] = useState<{[key: string]: boolean}>({});

  const handleFileUpload = async (file: File, type: 'profile' | 'photo', index?: number) => {
    const uploadKey = type === 'profile' ? 'profile' : `photo-${index}`;
    setUploading(prev => ({ ...prev, [uploadKey]: true }));

    try {
      const url = await uploadToCloudflareImages(file);
      
      if (type === 'profile') {
        setProfilePicture(url);
      } else if (type === 'photo' && index !== undefined) {
        updatePhoto(index, url);
      }
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Upload failed. Please try again.');
    } finally {
      setUploading(prev => ({ ...prev, [uploadKey]: false }));
    }
  };

  const addPhoto = () => {
    if (photos.length < 3) {
      setPhotos([...photos, { url: '', order: (photos.length + 1).toString() }]);
    }
  };

  const removePhoto = (index: number) => {
    setPhotos(photos.filter((_, i) => i !== index));
  };

  const updatePhoto = (index: number, url: string) => {
    const updatedPhotos = [...photos];
    updatedPhotos[index] = { ...updatedPhotos[index], url };
    setPhotos(updatedPhotos);
  };

  const addSocialLink = () => {
    if (socialLinks.length < 6) {
      setSocialLinks([
        ...socialLinks,
        {
          platform: '',
          url: '',
          displayText: '',
          order: (socialLinks.length + 1).toString(),
        },
      ]);
    }
  };

  const removeSocialLink = (index: number) => {
    setSocialLinks(socialLinks.filter((_, i) => i !== index));
  };

  const updateSocialLink = (index: number, field: keyof SocialLink, value: string) => {
    const updatedLinks = [...socialLinks];
    updatedLinks[index] = { ...updatedLinks[index], [field]: value };
    setSocialLinks(updatedLinks);
  };

  const handleFormSubmit = (formData: FormData) => {
    // Add photos and social links to form data
    photos.forEach((photo, index) => {
      if (photo.url) {
        formData.append(`photos[${index}][url]`, photo.url);
        formData.append(`photos[${index}][order]`, photo.order);
      }
    });

    socialLinks.forEach((link, index) => {
      if (link.platform && link.url) {
        formData.append(`socialLinks[${index}][platform]`, link.platform);
        formData.append(`socialLinks[${index}][url]`, link.url);
        formData.append(`socialLinks[${index}][displayText]`, link.displayText || link.platform);
        formData.append(`socialLinks[${index}][order]`, link.order);
      }
    });

    if (profilePicture) {
      formData.append('profilePicture', profilePicture);
    }

    action(formData);
  };

  const renderStep1 = () => (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <h3 className="font-semibold text-xl dark:text-zinc-50">Account Details</h3>
        <p className="text-gray-500 text-sm dark:text-zinc-400">
          Let's start with your basic information
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="email" className="font-normal text-zinc-600 dark:text-zinc-400">
          Email Address
        </Label>
        <Input
          id="email"
          name="email"
          className="bg-muted text-md md:text-sm"
          type="email"
          placeholder="user@acme.com"
          autoComplete="email"
          required
          defaultValue={defaultEmail}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="password" className="font-normal text-zinc-600 dark:text-zinc-400">
          Password
        </Label>
        <Input
          id="password"
          name="password"
          className="bg-muted text-md md:text-sm"
          type="password"
          required
          minLength={6}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="username" className="font-normal text-zinc-600 dark:text-zinc-400">
          Username
        </Label>
        <Input
          id="username"
          name="username"
          className="bg-muted text-md md:text-sm"
          type="text"
          placeholder="johndoe"
          required
          minLength={3}
          maxLength={32}
          pattern="^[a-zA-Z0-9_]+$"
        />
        <p className="text-xs text-gray-500">Only letters, numbers, and underscores allowed</p>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="displayName" className="font-normal text-zinc-600 dark:text-zinc-400">
          Display Name (optional)
        </Label>
        <Input
          id="displayName"
          name="displayName"
          className="bg-muted text-md md:text-sm"
          type="text"
          placeholder="John Doe"
          maxLength={100}
        />
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <h3 className="font-semibold text-xl dark:text-zinc-50">Profile &amp; Bio</h3>
        <p className="text-gray-500 text-sm dark:text-zinc-400">
          Tell us about yourself and add a profile picture
        </p>
        <p className="text-xs text-green-600 dark:text-green-400 mt-1">
          � Files uploaded to Cloudflare Images
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="profilePicture" className="font-normal text-zinc-600 dark:text-zinc-400">
          Profile Picture URL (optional)
        </Label>
        <div className="flex gap-2">
          <Input
            id="profilePicture"
            className="bg-muted text-md md:text-sm flex-1"
            type="url"
            placeholder="https://example.com/profile.jpg"
            value={profilePicture}
            onChange={(e) => setProfilePicture(e.target.value)}
          />
          <input
            type="file"
            accept="image/*"
            className="hidden"
            id="profile-upload"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                handleFileUpload(file, 'profile');
              }
            }}
          />
          <Button 
            type="button" 
            variant="outline" 
            size="icon"
            disabled={uploading.profile}
            onClick={() => document.getElementById('profile-upload')?.click()}
          >
            {uploading.profile ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Upload className="h-4 w-4" />
            )}
          </Button>
        </div>
        {profilePicture && (
          <div className="mt-2">
            <img
              src={profilePicture}
              alt="Profile preview"
              className="w-16 h-16 rounded-full object-cover border"
            />
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="bio" className="font-normal text-zinc-600 dark:text-zinc-400">
          Bio (optional)
        </Label>
        <Textarea
          id="bio"
          name="bio"
          className="bg-muted text-md md:text-sm min-h-[80px]"
          placeholder="Tell us about yourself..."
          maxLength={500}
        />
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <h3 className="font-semibold text-xl dark:text-zinc-50">Photos</h3>
        <p className="text-gray-500 text-sm dark:text-zinc-400">
          Add up to 3 photos to showcase yourself
        </p>
        <p className="text-xs text-green-600 dark:text-green-400 mt-1">
          � Files uploaded to Cloudflare Images
        </p>
      </div>

      <div className="space-y-3">
        {photos.map((photo, index) => (
          <Card key={index} className="p-3">
            <div className="flex gap-2 items-start">
              <div className="flex-1">
                <Label className="text-sm font-medium">Photo {index + 1}</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    type="url"
                    placeholder="https://example.com/photo.jpg"
                    value={photo.url}
                    onChange={(e) => updatePhoto(index, e.target.value)}
                    className="flex-1"
                  />
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    id={`photo-upload-${index}`}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        handleFileUpload(file, 'photo', index);
                      }
                    }}
                  />
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="icon"
                    disabled={uploading[`photo-${index}`]}
                    onClick={() => document.getElementById(`photo-upload-${index}`)?.click()}
                  >
                    {uploading[`photo-${index}`] ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Upload className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                {photo.url && (
                  <div className="mt-2">
                    <img
                      src={photo.url}
                      alt={`Photo ${index + 1}`}
                      className="w-20 h-20 rounded object-cover border"
                    />
                  </div>
                )}
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removePhoto(index)}
                className="text-red-500 hover:text-red-700"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </Card>
        ))}

        {photos.length < 3 && (
          <Button
            type="button"
            variant="outline"
            onClick={addPhoto}
            className="w-full"
          >
            <Camera className="h-4 w-4 mr-2" />
            Add Photo ({photos.length}/3)
          </Button>
        )}
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <h3 className="font-semibold text-xl dark:text-zinc-50">Social Links</h3>
        <p className="text-gray-500 text-sm dark:text-zinc-400">
          Add up to 6 social media links
        </p>
      </div>

      <div className="space-y-3">
        {socialLinks.map((link, index) => (
          <Card key={index} className="p-3">
            <div className="flex gap-2 items-start">
              <div className="flex-1 space-y-2">
                <Label className="text-sm font-medium">Link {index + 1}</Label>
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={link.platform}
                    onChange={(e) => updateSocialLink(index, 'platform', e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="">Select platform</option>
                    {socialPlatforms.map((platform) => (
                      <option key={platform} value={platform.toLowerCase()}>
                        {platform}
                      </option>
                    ))}
                  </select>
                  <Input
                    type="text"
                    placeholder="Display text"
                    value={link.displayText}
                    onChange={(e) => updateSocialLink(index, 'displayText', e.target.value)}
                    maxLength={100}
                  />
                </div>
                <Input
                  type="url"
                  placeholder="https://example.com/profile"
                  value={link.url}
                  onChange={(e) => updateSocialLink(index, 'url', e.target.value)}
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeSocialLink(index)}
                className="text-red-500 hover:text-red-700"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </Card>
        ))}

        {socialLinks.length < 6 && (
          <Button
            type="button"
            variant="outline"
            onClick={addSocialLink}
            className="w-full"
          >
            <Link className="h-4 w-4 mr-2" />
            Add Social Link ({socialLinks.length}/6)
          </Button>
        )}
      </div>
    </div>
  );

  return (
    <Form action={handleFormSubmit} className="flex flex-col gap-4">
      {/* Progress indicator */}
      <div className="flex justify-center mb-6">
        <div className="flex space-x-2">
          {[1, 2, 3, 4].map((step) => (
            <div
              key={step}
              className={`w-2 h-2 rounded-full ${
                step <= currentStep ? 'bg-blue-500' : 'bg-gray-300'
              }`}
            />
          ))}
        </div>
      </div>

      {currentStep === 1 && renderStep1()}
      {currentStep === 2 && renderStep2()}
      {currentStep === 3 && renderStep3()}
      {currentStep === 4 && renderStep4()}

      <div className="flex gap-3 mt-6">
        {currentStep > 1 && (
          <Button
            type="button"
            variant="outline"
            onClick={() => setCurrentStep(currentStep - 1)}
            className="flex-1"
          >
            Previous
          </Button>
        )}
        
        {currentStep < 4 ? (
          <Button
            type="button"
            onClick={() => setCurrentStep(currentStep + 1)}
            className="flex-1"
          >
            Next
          </Button>
        ) : (
          <div className="flex-1">{children}</div>
        )}
      </div>
    </Form>
  );
}