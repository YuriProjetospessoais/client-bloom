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

    // Check caller is company_admin
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
      const { name, email, password } = body;

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

      // Assign secretary role
      const { error: roleError } = await supabaseAdmin
        .from("user_roles")
        .insert({ user_id: newUser.user.id, role: "secretary", company_id: companyId });

      if (roleError) {
        // Rollback: delete user
        await supabaseAdmin.auth.admin.deleteUser(newUser.user.id);
        return new Response(JSON.stringify({ error: roleError.message }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ success: true, userId: newUser.user.id }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "update") {
      const { userId, name, email } = body;

      if (!userId) {
        return new Response(JSON.stringify({ error: "userId obrigatório" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Verify user belongs to same company as secretary
      const { data: targetRole } = await supabaseAdmin
        .from("user_roles")
        .select("role, company_id")
        .eq("user_id", userId)
        .eq("company_id", companyId)
        .eq("role", "secretary")
        .maybeSingle();

      if (!targetRole) {
        return new Response(JSON.stringify({ error: "Usuário não encontrado nesta empresa" }), {
          status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const updates: Record<string, unknown> = {};
      if (email) updates.email = email;
      if (name) updates.user_metadata = { full_name: name };

      if (Object.keys(updates).length > 0) {
        const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, updates);
        if (error) {
          return new Response(JSON.stringify({ error: error.message }), {
            status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }

      // Update profile
      if (name || email) {
        const profileUpdate: Record<string, string> = {};
        if (name) profileUpdate.full_name = name;
        if (email) profileUpdate.email = email;
        await supabaseAdmin
          .from("profiles")
          .update(profileUpdate)
          .eq("user_id", userId);
      }

      // Update password if provided
      if (body.password) {
        const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, { password: body.password });
        if (error) {
          return new Response(JSON.stringify({ error: error.message }), {
            status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "deactivate" || action === "activate") {
      const { userId } = body;

      if (!userId) {
        return new Response(JSON.stringify({ error: "userId obrigatório" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Verify user belongs to same company
      const { data: targetRole } = await supabaseAdmin
        .from("user_roles")
        .select("role, company_id")
        .eq("user_id", userId)
        .eq("company_id", companyId)
        .eq("role", "secretary")
        .maybeSingle();

      if (!targetRole) {
        return new Response(JSON.stringify({ error: "Usuário não encontrado nesta empresa" }), {
          status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const banned = action === "deactivate";
      const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
        ban_duration: banned ? "876000h" : "none", // ~100 years ban or unban
      });

      if (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "list") {
      // List all secretaries for this company
      const { data: roles, error: rolesError } = await supabaseAdmin
        .from("user_roles")
        .select("user_id")
        .eq("company_id", companyId)
        .eq("role", "secretary");

      if (rolesError || !roles || roles.length === 0) {
        return new Response(JSON.stringify({ staff: [] }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const userIds = roles.map((r) => r.user_id);

      // Get user details from auth
      const staff = [];
      for (const uid of userIds) {
        const { data: { user: u } } = await supabaseAdmin.auth.admin.getUserById(uid);
        if (u) {
          staff.push({
            id: u.id,
            email: u.email,
            name: u.user_metadata?.full_name || u.email?.split("@")[0] || "",
            createdAt: u.created_at,
            banned: u.banned_until ? new Date(u.banned_until) > new Date() : false,
          });
        }
      }

      return new Response(JSON.stringify({ staff }), {
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
