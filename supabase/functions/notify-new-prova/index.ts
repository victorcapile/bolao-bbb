import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface Payload {
  type: 'INSERT'
  table: 'provas'
  record: {
    id: string
    tipo: string
    descricao: string | null
    pergunta: string | null
    is_aposta_binaria: boolean
    tipo_customizado: boolean
    titulo_customizado: string | null
    data_prova: string
    pontos_base: number | null
    odds_sim: number | null
    odds_nao: number | null
  }
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

    // Buscar todos os usuários cadastrados
    const { data: users } = await supabaseClient
      .from('profiles')
      .select('email, username')
      .not('email', 'is', null)

    if (!users || users.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No users to notify' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Preparar informações da prova
    let provaDescricao = ''
    let provaIcon = '🎯'

    if (record.is_aposta_binaria) {
      provaDescricao = record.pergunta || 'Aposta Sim/Não'
      provaIcon = '❓'
    } else if (record.tipo_customizado) {
      provaDescricao = record.titulo_customizado || 'Prova Customizada'
      provaIcon = '⭐'
    } else {
      const tipoLabels: Record<string, string> = {
        'paredao': '🔥 Paredão',
        'lider': '👑 Líder',
        'anjo': '😇 Anjo',
        'bate_volta': '🏃 Bate e Volta',
        'palpite_paredao': '🎲 Palpite Paredão'
      }
      provaDescricao = tipoLabels[record.tipo] || record.tipo
      provaIcon = provaDescricao.split(' ')[0]
    }

    // Formatar data
    const dataProva = new Date(record.data_prova).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    })

    // Enviar email para cada usuário
    for (const user of users) {
      if (!user.email) continue

      let htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #1a1a1a;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #f97316; font-size: 28px; margin: 0;">Nova Prova Disponível!</h1>
            <p style="color: #9ca3af; font-size: 14px; margin-top: 5px;">Bolão BBB</p>
          </div>

          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 16px; padding: 30px; margin: 20px 0; box-shadow: 0 4px 6px rgba(0,0,0,0.3);">
            <div style="text-align: center; margin-bottom: 20px;">
              <span style="font-size: 48px;">${provaIcon}</span>
            </div>
            <h2 style="color: white; margin: 0 0 10px 0; font-size: 24px; text-align: center;">${provaDescricao}</h2>
            ${record.descricao ? `<p style="color: rgba(255,255,255,0.9); margin: 10px 0; text-align: center; font-size: 16px;">${record.descricao}</p>` : ''}
            <div style="text-align: center; margin-top: 20px;">
              <span style="background: rgba(255,255,255,0.2); color: white; padding: 8px 16px; border-radius: 20px; font-size: 14px; display: inline-block;">
                📅 ${dataProva}
              </span>
            </div>
          </div>
      `

      // Adicionar informações de pontos para apostas binárias
      if (record.is_aposta_binaria && record.odds_sim && record.odds_nao && record.pontos_base) {
        const pontosSim = Math.round(record.pontos_base * record.odds_sim)
        const pontosNao = Math.round(record.pontos_base * record.odds_nao)

        htmlContent += `
          <div style="background: rgba(255,255,255,0.05); border-radius: 12px; padding: 20px; margin: 20px 0;">
            <p style="color: #9ca3af; margin: 0 0 15px 0; font-size: 14px; text-align: center;">Possíveis Pontos:</p>
            <div style="display: flex; gap: 10px; justify-content: center;">
              <div style="background: rgba(34, 197, 94, 0.2); border: 2px solid rgba(34, 197, 94, 0.4); border-radius: 8px; padding: 12px 20px; text-align: center;">
                <div style="color: #22c55e; font-size: 12px; margin-bottom: 4px;">✓ SIM</div>
                <div style="color: white; font-size: 18px; font-weight: bold;">${pontosSim} pts</div>
                <div style="color: #86efac; font-size: 11px;">${record.odds_sim}x</div>
              </div>
              <div style="background: rgba(239, 68, 68, 0.2); border: 2px solid rgba(239, 68, 68, 0.4); border-radius: 8px; padding: 12px 20px; text-align: center;">
                <div style="color: #ef4444; font-size: 12px; margin-bottom: 4px;">✕ NÃO</div>
                <div style="color: white; font-size: 18px; font-weight: bold;">${pontosNao} pts</div>
                <div style="color: #fca5a5; font-size: 11px;">${record.odds_nao}x</div>
              </div>
            </div>
          </div>
        `
      }

      htmlContent += `
          <div style="text-align: center; margin-top: 30px;">
            <p style="color: #9ca3af; font-size: 14px; margin-bottom: 20px;">
              Não perca tempo! Faça sua aposta agora e concorra a prêmios.
            </p>
            <a href="${Deno.env.get('SITE_URL') || 'https://bolao-bbb.vercel.app'}"
               style="display: inline-block; background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; box-shadow: 0 4px 6px rgba(249, 115, 22, 0.4);">
              Fazer minha aposta agora
            </a>
          </div>

          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid rgba(255,255,255,0.1); text-align: center;">
            <p style="color: #6b7280; font-size: 12px; margin: 0;">
              Você está recebendo este email porque está cadastrado no Bolão BBB
            </p>
          </div>
        </div>
      `

      await supabaseClient.auth.admin.sendEmail({
        email: user.email,
        subject: `${provaIcon} Nova Prova: ${provaDescricao}`,
        html: htmlContent
      })
    }

    return new Response(
      JSON.stringify({ message: `Notified ${users.length} users about new prova` }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})
