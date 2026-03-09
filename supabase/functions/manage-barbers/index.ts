import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    // Verify caller is company_admin
    const authHeader = req.headers.get("Authorization")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user: caller } } = await callerClient.auth.getUser();
    if (!caller) {
      return new Response(JSON.stringify({ error: "Não autenticado" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: callerRole } = await supabaseAdmin
      .from("user_roles")
      .select("role, company_id")
      .eq("user_id", caller.id)
      .eq("role", "company_admin")
      .maybeSingle();

    if (!callerRole) {
      return new Response(JSON.stringify({ error: "Sem permissão" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const companyId = callerRole.company_id;
    const body = await req.json();
    const { action } = body;

    if (action === "create") {
      const { name, email, password, specialties } = body;

      if (!name || !email || !password) {
        return new Response(JSON.stringify({ error: "Campos obrigatórios: name, email, password" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Create auth user
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: name },
      });

      if (createError) {
        return new Response(JSON.stringify({ error: createError.message }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Assign employee role
      const { error: roleError } = await supabaseAdmin
        .from("user_roles")
        .insert({ user_id: newUser.user.id, role: "employee", company_id: companyId });

      if (roleError) {
        await supabaseAdmin.auth.admin.deleteUser(newUser.user.id);
        return new Response(JSON.stringify({ error: roleError.message }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Create professional record linked to user
      const { data: professional, error: profError } = await supabaseAdmin
        .from("professionals")
        .insert({
          name,
          user_id: newUser.user.id,
          company_id: companyId,
          active: true,
          specialties: specialties || [],
        })
        .select("id")
        .single();

      if (profError) {
        // Rollback
        await supabaseAdmin.from("user_roles").delete().eq("user_id", newUser.user.id);
        await supabaseAdmin.auth.admin.deleteUser(newUser.user.id);
        return new Response(JSON.stringify({ error: profError.message }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ success: true, userId: newUser.user.id, professionalId: professional.id }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "update") {
      const { professionalId, name, email, password, specialties } = body;

      if (!professionalId) {
        return new Response(JSON.stringify({ error: "professionalId obrigatório" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Get professional and verify it belongs to same company
      const { data: prof } = await supabaseAdmin
        .from("professionals")
        .select("id, user_id, company_id")
        .eq("id", professionalId)
        .eq("company_id", companyId)
        .maybeSingle();

      if (!prof) {
        return new Response(JSON.stringify({ error: "Profissional não encontrado" }), {
          status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Update professional record
      const profUpdate: Record<string, unknown> = {};
      if (name) profUpdate.name = name;
      if (specialties !== undefined) profUpdate.specialties = specialties;

      if (Object.keys(profUpdate).length > 0) {
        await supabaseAdmin.from("professionals").update(profUpdate).eq("id", professionalId);
      }

      // Update auth user if linked
      if (prof.user_id) {
        const authUpdate: Record<string, unknown> = {};
        if (email) authUpdate.email = email;
        if (name) authUpdate.user_metadata = { full_name: name };

        if (Object.keys(authUpdate).length > 0) {
          await supabaseAdmin.auth.admin.updateUserById(prof.user_id, authUpdate);
        }

        if (password) {
          await supabaseAdmin.auth.admin.updateUserById(prof.user_id, { password });
        }

        // Update profile
        const profileUpdate: Record<string, string> = {};
        if (name) profileUpdate.full_name = name;
        if (email) profileUpdate.email = email;
        if (Object.keys(profileUpdate).length > 0) {
          await supabaseAdmin.from("profiles").update(profileUpdate).eq("user_id", prof.user_id);
        }
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "deactivate" || action === "activate") {
      const { professionalId } = body;

      const { data: prof } = await supabaseAdmin
        .from("professionals")
        .select("id, user_id, company_id")
        .eq("id", professionalId)
        .eq("company_id", companyId)
        .maybeSingle();

      if (!prof) {
        return new Response(JSON.stringify({ error: "Profissional não encontrado" }), {
          status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const isActive = action === "activate";

      // Update professional active status
      await supabaseAdmin.from("professionals").update({ active: isActive }).eq("id", professionalId);

      // Ban/unban auth user if linked
      if (prof.user_id) {
        await supabaseAdmin.auth.admin.updateUserById(prof.user_id, {
          ban_duration: isActive ? "none" : "876000h",
        });
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "list") {
      // List all professionals (barbers) for this company
      const { data: professionals, error } = await supabaseAdmin
        .from("professionals")
        .select("id, name, user_id, active, specialties, avatar_url, created_at")
        .eq("company_id", companyId)
        .order("name");

      if (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Enrich with auth user data
      const barbers = [];
      for (const prof of professionals || []) {
        let email = "";
        let hasAccount = false;

        if (prof.user_id) {
          const { data: { user: u } } = await supabaseAdmin.auth.admin.getUserById(prof.user_id);
          if (u) {
            email = u.email || "";
            hasAccount = true;
          }
        }

        barbers.push({
          id: prof.id,
          userId: prof.user_id,
          name: prof.name,
          email,
          active: prof.active,
          hasAccount,
          specialties: prof.specialties || [],
          avatarUrl: prof.avatar_url,
          createdAt: prof.created_at,
        });
      }

      return new Response(JSON.stringify({ barbers }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Ação inválida" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
