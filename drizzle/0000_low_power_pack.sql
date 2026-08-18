CREATE TABLE "items" (
	"id" serial PRIMARY KEY NOT NULL,
	"point_id" integer NOT NULL,
	"category" text NOT NULL,
	"product" text NOT NULL,
	"detail" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"reserved_by" text,
	"reserved_at" timestamp with time zone,
	"delivered_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "points" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"contact" text,
	"note" text,
	"lat" double precision NOT NULL,
	"lng" double precision NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
