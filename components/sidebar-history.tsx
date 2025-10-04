'use client';

import { useParams } from 'next/navigation';
import type { User } from 'next-auth';
import { useState } from 'react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  useSidebar,
} from '@/components/ui/sidebar';
import { fetcher } from '@/lib/utils';
import { ChatItem } from './sidebar-history-item';
import useSWR from 'swr';





export function SidebarHistory({ user }: { user: User | undefined }) {
  const { setOpenMobile } = useSidebar();
  const { username } = useParams();
  
  // Fetch all usernames that the user has chatted with
  const { 
    data: usernamesData, 
    isLoading,
    error 
  } = useSWR<{ usernames: string[] }>(
    user ? '/api/usernames' : null,
    fetcher
  );


  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const usernames = usernamesData?.usernames || [];
  const hasEmptyUsernames = usernames.length === 0;

  const handleDelete = async () => {
    // For now, we'll just hide this functionality for username chats
    // In the future, we might want to delete all chats with a specific user
    setShowDeleteDialog(false);
  };

  if (!user) {
    return (
      <SidebarGroup>
        <SidebarGroupContent>
          <div className="flex w-full flex-row items-center justify-center gap-2 px-2 text-sm text-zinc-500">
            Login to save and revisit previous chats!
          </div>
        </SidebarGroupContent>
      </SidebarGroup>
    );
  }

  if (isLoading) {
    return (
      <SidebarGroup>
        <SidebarGroupContent>
          <div className="flex flex-col">
            {[44, 32, 28, 64, 52].map((item) => (
              <div
                key={item}
                className="flex h-8 items-center gap-2 rounded-md px-2"
              >
                <div
                  className="h-4 max-w-(--skeleton-width) flex-1 rounded-md bg-sidebar-accent-foreground/10"
                  style={
                    {
                      '--skeleton-width': `${item}%`,
                    } as React.CSSProperties
                  }
                />
              </div>
            ))}
          </div>
        </SidebarGroupContent>
      </SidebarGroup>
    );
  }

  if (hasEmptyUsernames && !isLoading) {
    return (
      <SidebarGroup>
        <SidebarGroupContent>
          <div className="flex w-full flex-row items-center justify-center gap-2 px-2 text-sm text-zinc-500">
            Start chatting with people to see them here!
          </div>
        </SidebarGroupContent>
      </SidebarGroup>
    );
  }

  return (
    <>
      <SidebarGroup>
        <SidebarGroupContent>
          <SidebarMenu>
            <div className="flex flex-col gap-2">
              {usernames.length > 0 && (
                <div>
                  <div className="px-2 py-1 text-sidebar-foreground/50 text-xs">
                    People
                  </div>
                  {usernames.map((targetUsername) => (
                    <motion.div
                      key={targetUsername}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.15 }}
                    >
                      <ChatItem
                        chat={{
                          id: `username-${targetUsername}`,
                          createdAt: new Date(),
                          title: `@${targetUsername}`,
                          userId: '',
                          visibility: 'private' as const,
                          chatType: 'username_chat' as const,
                          targetUsername,
                          lastContext: null,
                        }}
                        isActive={targetUsername === username}
                        onDelete={() => {}} // Disable delete for now
                        setOpenMobile={setOpenMobile}
                      />
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your
              chat and remove it from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
