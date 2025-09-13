'use server';

import { z } from 'zod';

import { createUser, getUser, createUserWithProfile, getUserByUsername, saveUserPhotos, saveSocialLinks } from '@/lib/db/queries';
import { registerFormSchema } from '@/lib/types';

import { signIn } from './auth';

const authFormSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export interface LoginActionState {
  status: 'idle' | 'in_progress' | 'success' | 'failed' | 'invalid_data';
}

export const login = async (
  _: LoginActionState,
  formData: FormData,
): Promise<LoginActionState> => {
  try {
    const validatedData = authFormSchema.parse({
      email: formData.get('email'),
      password: formData.get('password'),
    });

    await signIn('credentials', {
      email: validatedData.email,
      password: validatedData.password,
      redirect: false,
    });

    return { status: 'success' };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { status: 'invalid_data' };
    }

    return { status: 'failed' };
  }
};

export interface RegisterActionState {
  status:
    | 'idle'
    | 'in_progress'
    | 'success'
    | 'failed'
    | 'user_exists'
    | 'username_taken'
    | 'invalid_data';
}

function parseFormDataArray(formData: FormData, prefix: string) {
  const result: any[] = [];
  const keys = Array.from(formData.keys()).filter(key => key.startsWith(prefix));
  
  // Group by index
  const groupedKeys: { [index: string]: { [field: string]: string } } = {};
  
  keys.forEach(key => {
    const match = key.match(new RegExp(`${prefix}\\[(\\d+)\\]\\[(.+)\\]`));
    if (match) {
      const [, index, field] = match;
      if (!groupedKeys[index]) {
        groupedKeys[index] = {};
      }
      groupedKeys[index][field] = formData.get(key) as string;
    }
  });
  
  // Convert to array
  Object.keys(groupedKeys).forEach(index => {
    result[parseInt(index)] = groupedKeys[index];
  });
  
  return result.filter(item => item && Object.keys(item).length > 0);
}

export const register = async (
  _: RegisterActionState,
  formData: FormData,
): Promise<RegisterActionState> => {
  try {
    // Parse photos and social links
    const photos = parseFormDataArray(formData, 'photos');
    const socialLinks = parseFormDataArray(formData, 'socialLinks');
    
    const rawData = {
      email: formData.get('email'),
      password: formData.get('password'),
      username: formData.get('username'),
      displayName: formData.get('displayName') || undefined,
      bio: formData.get('bio') || undefined,
      profilePicture: formData.get('profilePicture') || undefined,
      photos: photos.length > 0 ? photos : undefined,
      socialLinks: socialLinks.length > 0 ? socialLinks : undefined,
    };

    const validatedData = registerFormSchema.parse(rawData);

    // Check if user already exists
    const [existingUser] = await getUser(validatedData.email);
    if (existingUser) {
      return { status: 'user_exists' } as RegisterActionState;
    }

    // Check if username is taken
    const [existingUsername] = await getUserByUsername(validatedData.username);
    if (existingUsername) {
      return { status: 'username_taken' } as RegisterActionState;
    }

    // Create user with profile data
    const newUser = await createUserWithProfile(
      validatedData.email,
      validatedData.password,
      validatedData.username,
      validatedData.displayName,
      validatedData.bio
    );

    // Update profile picture if provided
    if (validatedData.profilePicture) {
      // In a real app, you'd handle file upload here
      // For now, we'll just store the URL
    }

    // Save photos if provided
    if (validatedData.photos && validatedData.photos.length > 0) {
      await saveUserPhotos(newUser.id, validatedData.photos);
    }

    // Save social links if provided
    if (validatedData.socialLinks && validatedData.socialLinks.length > 0) {
      await saveSocialLinks(newUser.id, validatedData.socialLinks);
    }

    // Sign in the user
    await signIn('credentials', {
      email: validatedData.email,
      password: validatedData.password,
      redirect: false,
    });

    return { status: 'success' };
  } catch (error) {
    console.error('Registration error:', error);
    if (error instanceof z.ZodError) {
      return { status: 'invalid_data' };
    }

    return { status: 'failed' };
  }
};
