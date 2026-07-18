import { NextResponse } from "next/server";
import { supabaseAdmin, isAdminActor } from "@/lib/supabaseAdmin";

export async function GET() {
  const [{ data, error }, { data: subcategories, error: subError }] = await Promise.all([
    supabaseAdmin.from("categories").select("*").order("sort_order", { ascending: true }),
    supabaseAdmin.from("subcategories").select("*").order("sort_order", { ascending: true }),
  ]);

  if (error || subError) return NextResponse.json({ error: (error || subError).message }, { status: 500 });
  return NextResponse.json({ categories: data || [], subcategories: subcategories || [] });
}

export async function POST(request) {
  const { actorId, action, category, subcategory } = await request.json();

  if (!(await isAdminActor(actorId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (["create-subcategory", "update-subcategory", "delete-subcategory"].includes(action)) {
    if (action === "create-subcategory") {
      if (!subcategory?.category_id || !subcategory?.label?.trim()) return NextResponse.json({ error: "Category and label are required" }, { status: 400 });
      const { error } = await supabaseAdmin.from("subcategories").insert({ category_id: subcategory.category_id, label: subcategory.label.trim(), sort_order: Number(subcategory.sort_order) || 0 });
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    } else if (action === "update-subcategory") {
      const { error } = await supabaseAdmin.from("subcategories").update({ label: subcategory.label.trim(), sort_order: Number(subcategory.sort_order) || 0 }).eq("id", subcategory.id);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    } else {
      const { count } = await supabaseAdmin.from("listings").select("*", { count: "exact", head: true }).eq("subcategory_id", subcategory.id);
      if (count > 0) return NextResponse.json({ error: `Cannot delete: ${count} listing(s) use this subcategory.` }, { status: 409 });
      const { error } = await supabaseAdmin.from("subcategories").delete().eq("id", subcategory.id);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ success: true });
  }

  if (action === "create") {
    const { id, label, icon, image_url, sort_order } = category;
    if (!id || !label) {
      return NextResponse.json({ error: "id and label are required" }, { status: 400 });
    }
    const { error } = await supabaseAdmin.from("categories").insert({
      id,
      label,
      icon: icon || "Tag",
      image_url: image_url || null,
      sort_order: sort_order ?? 0,
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  }

  if (action === "update") {
    const { id, label, icon, image_url, sort_order } = category;
    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }
    const updates = {};
    if (label !== undefined) updates.label = label;
    if (icon !== undefined) updates.icon = icon;
    if (image_url !== undefined) updates.image_url = image_url;
    if (sort_order !== undefined) updates.sort_order = sort_order;
    const { error } = await supabaseAdmin.from("categories").update(updates).eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  }

  if (action === "delete") {
    const { id } = category;
    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }
    const { count: subcategoryCount, error: subcategoryCountError } = await supabaseAdmin.from("subcategories").select("*", { count: "exact", head: true }).eq("category_id", id);
    if (subcategoryCountError) return NextResponse.json({ error: subcategoryCountError.message }, { status: 500 });
    if (subcategoryCount > 0) return NextResponse.json({ error: `Cannot delete: ${subcategoryCount} subcategory(s) belong to this category.` }, { status: 409 });
    const { count, error: countError } = await supabaseAdmin
      .from("listings")
      .select("*", { count: "exact", head: true })
      .eq("category", id);
    if (countError) return NextResponse.json({ error: countError.message }, { status: 500 });
    if (count > 0) {
      return NextResponse.json({ error: `Cannot delete: ${count} listing(s) use this category.` }, { status: 409 });
    }
    const { error } = await supabaseAdmin.from("categories").delete().eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
