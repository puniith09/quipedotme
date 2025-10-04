ALTER TABLE "Chat" ADD COLUMN "chatType" varchar DEFAULT 'profile_management' NOT NULL;--> statement-breakpoint
ALTER TABLE "Chat" ADD COLUMN "targetUsername" varchar(32);--> statement-breakpoint
ALTER TABLE "User" ADD COLUMN "username" varchar(32);--> statement-breakpoint
ALTER TABLE "User" ADD CONSTRAINT "User_username_unique" UNIQUE("username");