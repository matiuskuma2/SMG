export type Radio = {
	radio_id: string;
	radio_name: string;
	image_url: string | null;
	radio_url: string | null;
	publish_start_at: string | null;
	publish_end_at: string | null;
	radio_description: string | null;
	created_at: string;
	updated_at: string;
	deleted_at: string | null;
};

export type RadioData = {
	id: string;
	name: string;
	imageUrl: string | null;
	radioUrl: string | null;
	registrationStartAt: string | null;
	registrationEndAt: string | null;
	description: string | null;
	createdAt: string;
	updatedAt: string;
};
