import { supabase } from "@/lib/supabaseServerClient";

export async function GET(_req, { params }) {
	const { id } = await params;
	// Include display_name in the select query.
	const { data, error } = await supabase
		.from("profiles")
		.select("id, display_name, email, bio, profile_picture, is_admin")
		.eq("id", id)
		.single();

	if (error) {
		return new Response(JSON.stringify({ error: error.message }), {
			status: 500,
		});
	}
	return new Response(JSON.stringify(data), { status: 200 });
}

export async function PUT(req, { params }) {
	const { id } = params;
	const body = await req.json();
	const updateData = {};

	if (body.display_name !== undefined)
		updateData.display_name = body.display_name;
	if (body.bio !== undefined) updateData.bio = body.bio;
	if (body.profile_picture !== undefined)
		updateData.profile_picture = body.profile_picture;

	const { error } = await supabase
		.from("profiles")
		.update(updateData)
		.eq("id", id);

	if (error) {
		return new Response(JSON.stringify({ error: error.message }), {
			status: 500,
		});
	}
	return new Response(JSON.stringify({ success: true }), { status: 200 });
}
