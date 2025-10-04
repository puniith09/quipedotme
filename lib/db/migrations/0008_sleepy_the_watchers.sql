ALTER TABLE "Chat" ADD COLUMN "chatType" varchar DEFAULT 'profile_management' NOT NULL;--> statement-breakpoint
ALTER TABLE "Chat" ADD COLUMN "targetUsername" varchar(32);