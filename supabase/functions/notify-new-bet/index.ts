import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface Payload {
  type: 'INSERT'
  table: 'apostas'
  record: {
    id: string
    user_id: string
    prova_id: string
    participante_id: string | null
    resposta_binaria: string | null
  }
  old_record: null
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const payload: Payload = await req.json()
    const { record } = payload

    // Buscar informações do usuário que fez a aposta
    const { data: betUser } = await supabaseClient
      .from('profiles')
      .select('username')
      .eq('id', record.user_id)
      .single()

    // Buscar informações da prova
    const { data: prova } = await supabaseClient
      .from('provas')
      .select('tipo, descricao, pergunta, is_aposta_binaria')
      .eq('id', record.prova_id)
      .single()

    // Buscar participante (se não for aposta binária)
    let participanteNome = 'SIM/NÃO'
    if (record.participante_id) {
      const { data: participante } = await supabaseClient
        .from('participantes')
        .select('nome')
        .eq('id', record.participante_id)
        .single()
      participanteNome = participante?.nome || 'Participante'
    } else if (record.resposta_binaria) {
      participanteNome = record.resposta_binaria.toUpperCase()
    }

    // Buscar todos os usuários EXCETO quem fez a aposta
    const { data: users } = await supabaseClient
      .from('profiles')
      .select('email, username')
      .neq('id', record.user_id)
      .not('email', 'is', null)

    if (!users || users.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No users to notify' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Enviar email para cada usuário
    const provaDescricao = prova?.is_aposta_binaria
      ? prova.pergunta
      : (prova?.descricao || prova?.tipo || 'Nova prova')

    for (const user of users) {
      if (!user.email) continue

      await supabaseClient.auth.admin.sendEmail({
        email: user.email,
        subject: `🎯 ${betUser?.username} fez uma aposta!`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #f97316;">Nova Aposta no Bolão BBB!</h2>
            <p style="font-size: 16px; color: #333;">
              <strong>@${betUser?.username}</strong> acabou de fazer uma aposta:
            </p>
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 12px; padding: 20px; margin: 20px 0;">
              <p style="color: white; margin: 0; font-size: 14px; opacity: 0.9;">Prova:</p>
              <p style="color: white; margin: 5px 0 15px 0; font-size: 18px; font-weight: bold;">${provaDescricao}</p>
              <p style="color: white; margin: 0; font-size: 14px; opacity: 0.9;">Votou em:</p>
              <p style="color: white; margin: 5px 0 0 0; font-size: 20px; font-weight: bold;">${participanteNome}</p>
            </div>
            <p style="font-size: 14px; color: #666;">
              Não fique de fora! Faça sua aposta também e concorra a prêmios.
            </p>
            <a href="${Deno.env.get('SITE_URL') || 'https://bolao-bbb.vercel.app'}"
               style="display: inline-block; background: #f97316; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; margin-top: 10px;">
              Fazer minha aposta
            </a>
          </div>
        `
      })
    }

    return new Response(
      JSON.stringify({ message: `Notified ${users.length} users` }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})
