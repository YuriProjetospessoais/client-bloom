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
      const { name, email, password, role, specialties } = body;
      const staffRole = role === "employee" ? "employee" : "secretary";

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
        console.error('Create user error:', createError);
        const msg = createError.message?.includes('already') ? 'Email já está em uso' : 'Erro ao criar usuário';
        return new Response(JSON.stringify({ error: msg }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Assign role
      const { error: roleError } = await supabaseAdmin
        .from("user_roles")
        .insert({ user_id: newUser.user.id, role: staffRole, company_id: companyId });

      if (roleError) {
        await supabaseAdmin.auth.admin.deleteUser(newUser.user.id);
        console.error('Role assign error:', roleError);
        return new Response(JSON.stringify({ error: 'Erro ao atribuir papel' }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // If barber (employee), create or link professional record
      if (staffRole === "employee") {
        const { error: profError } = await supabaseAdmin
          .from("professionals")
          .insert({
            name,
            company_id: companyId,
            user_id: newUser.user.id,
            specialties: Array.isArray(specialties) ? specialties : [],
            active: true,
          });

        if (profError) {
          // Rollback
          await supabaseAdmin.from("user_roles").delete().eq("user_id", newUser.user.id);
          await supabaseAdmin.auth.admin.deleteUser(newUser.user.id);
          console.error('Professional create error:', profError);
          return new Response(JSON.stringify({ error: 'Erro ao criar profissional' }), {
            status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }

      return new Response(JSON.stringify({ success: true, userId: newUser.user.id }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "update") {
      const { userId, name, email, password, role, specialties } = body;

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
        .in("role", ["secretary", "employee"])
        .maybeSingle();

      if (!targetRole) {
        return new Response(JSON.stringify({ error: "Usuário não encontrado nesta empresa" }), {
          status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Update auth user
      const updates: Record<string, unknown> = {};
      if (email) updates.email = email;
      if (name) updates.user_metadata = { full_name: name };

      if (Object.keys(updates).length > 0) {
        const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, updates);
        if (error) {
          console.error('Update user error:', error);
          return new Response(JSON.stringify({ error: 'Erro ao atualizar usuário' }), {
            status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }

      // Update profile
      if (name || email) {
        const profileUpdate: Record<string, string> = {};
        if (name) profileUpdate.full_name = name;
        if (email) profileUpdate.email = email;
        await supabaseAdmin.from("profiles").update(profileUpdate).eq("user_id", userId);
      }

      // Update password if provided
      if (password) {
        const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, { password });
        if (error) {
          console.error('Update password error:', error);
          return new Response(JSON.stringify({ error: 'Erro ao atualizar senha' }), {
            status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }

      // Update professional record if barber
      if (targetRole.role === "employee" && specialties !== undefined) {
        await supabaseAdmin
          .from("professionals")
          .update({
            name: name || undefined,
            specialties: Array.isArray(specialties) ? specialties : [],
          })
          .eq("user_id", userId)
          .eq("company_id", companyId);
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
        .in("role", ["secretary", "employee"])
        .maybeSingle();

      if (!targetRole) {
        return new Response(JSON.stringify({ error: "Usuário não encontrado nesta empresa" }), {
          status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const banned = action === "deactivate";
      const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
        ban_duration: banned ? "876000h" : "none",
      });

      if (error) {
        console.error('Toggle user error:', error);
        return new Response(JSON.stringify({ error: 'Erro ao alterar status do usuário' }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // If barber, also toggle professional active status
      if (targetRole.role === "employee") {
        await supabaseAdmin
          .from("professionals")
          .update({ active: !banned })
          .eq("user_id", userId)
          .eq("company_id", companyId);
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "list") {
      // List all staff (secretaries + barbers) for this company
      const { data: roles, error: rolesError } = await supabaseAdmin
        .from("user_roles")
        .select("user_id, role")
        .eq("company_id", companyId)
        .in("role", ["secretary", "employee"]);

      if (rolesError || !roles || roles.length === 0) {
        return new Response(JSON.stringify({ staff: [] }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Get professional records for barbers
      const barberUserIds = roles.filter((r) => r.role === "employee").map((r) => r.user_id);
      let professionalsMap: Record<string, { specialties: string[] }> = {};
      if (barberUserIds.length > 0) {
        const { data: profs } = await supabaseAdmin
          .from("professionals")
          .select("user_id, specialties")
          .eq("company_id", companyId)
          .in("user_id", barberUserIds);

        if (profs) {
          for (const p of profs) {
            professionalsMap[p.user_id] = { specialties: p.specialties || [] };
          }
        }
      }

      const staff = [];
      for (const r of roles) {
        const { data: { user: u } } = await supabaseAdmin.auth.admin.getUserById(r.user_id);
        if (u) {
          staff.push({
            id: u.id,
            email: u.email,
            name: u.user_metadata?.full_name || u.email?.split("@")[0] || "",
            role: r.role,
            createdAt: u.created_at,
            banned: u.banned_until ? new Date(u.banned_until) > new Date() : false,
            specialties: professionalsMap[u.id]?.specialties || [],
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
    console.error('Internal error:', err);
    return new Response(JSON.stringify({ error: 'Erro interno do servidor' }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
