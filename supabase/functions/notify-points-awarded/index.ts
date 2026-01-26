import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface Payload {
  type: 'UPDATE'
  table: 'provas'
  record: {
    id: string
    tipo: string
    descricao: string | null
    pergunta: string | null
    is_aposta_binaria: boolean
    tipo_customizado: boolean
    titulo_customizado: string | null
    fechada: boolean
    resposta_correta: string | null
    vencedor_id: string | null
  }
  old_record: {
    fechada: boolean
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
    const { record, old_record } = payload

    // Só notificar se a prova foi FECHADA agora (transição de false para true)
    if (!record.fechada || old_record.fechada) {
      return new Response(
        JSON.stringify({ message: 'Prova not closed, skipping notification' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Buscar apostas da prova com pontos > 0 (quem ganhou)
    const { data: apostasVencedoras } = await supabaseClient
      .from('apostas')
      .select('user_id, pontos, resposta_binaria, participante_id')
      .eq('prova_id', record.id)
      .gt('pontos', 0)

    if (!apostasVencedoras || apostasVencedoras.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No winners for this prova' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Buscar informações dos usuários vencedores
    const userIds = [...new Set(apostasVencedoras.map(a => a.user_id))]
    const { data: users } = await supabaseClient
      .from('profiles')
      .select('id, email, username')
      .in('id', userIds)
      .not('email', 'is', null)

    if (!users || users.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No users with email to notify' }),
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

    // Buscar nome do vencedor (se não for binária)
    let vencedorNome = record.resposta_correta ? record.resposta_correta.toUpperCase() : null
    if (record.vencedor_id) {
      const { data: vencedor } = await supabaseClient
        .from('participantes')
        .select('nome')
        .eq('id', record.vencedor_id)
        .single()
      vencedorNome = vencedor?.nome || 'Vencedor'
    }

    // Enviar email para cada vencedor
    for (const user of users) {
      if (!user.email) continue

      const apostasDoUsuario = apostasVencedoras.filter(a => a.user_id === user.id)
      const totalPontos = apostasDoUsuario.reduce((sum, a) => sum + a.pontos, 0)

      const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #1a1a1a;">
          <div style="text-align: center; margin-bottom: 30px;">
            <div style="font-size: 64px; margin-bottom: 10px;">🎉</div>
            <h1 style="color: #22c55e; font-size: 32px; margin: 0;">Você Ganhou Pontos!</h1>
            <p style="color: #9ca3af; font-size: 14px; margin-top: 5px;">Bolão BBB</p>
          </div>

          <div style="background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); border-radius: 16px; padding: 30px; margin: 20px 0; box-shadow: 0 8px 16px rgba(34, 197, 94, 0.3);">
            <div style="text-align: center;">
              <p style="color: rgba(255,255,255,0.9); margin: 0 0 10px 0; font-size: 14px;">Você acertou em:</p>
              <h2 style="color: white; margin: 0 0 20px 0; font-size: 24px;">${provaDescricao}</h2>
              ${vencedorNome ? `
                <div style="background: rgba(255,255,255,0.2); border-radius: 12px; padding: 15px; margin: 15px 0;">
                  <p style="color: rgba(255,255,255,0.8); margin: 0 0 5px 0; font-size: 12px;">Resposta Correta:</p>
                  <p style="color: white; margin: 0; font-size: 20px; font-weight: bold;">${vencedorNome}</p>
                </div>
              ` : ''}
              <div style="margin-top: 20px;">
                <div style="background: rgba(255,255,255,0.95); border-radius: 12px; padding: 20px; display: inline-block;">
                  <p style="color: #16a34a; margin: 0 0 5px 0; font-size: 14px; font-weight: bold;">Pontos Ganhos</p>
                  <p style="color: #1a1a1a; margin: 0; font-size: 48px; font-weight: bold;">+${totalPontos}</p>
                </div>
              </div>
            </div>
          </div>

          <div style="text-align: center; margin-top: 30px;">
            <p style="color: #9ca3af; font-size: 14px; margin-bottom: 20px;">
              Continue apostando para ganhar mais pontos!
            </p>
            <a href="${Deno.env.get('SITE_URL') || 'https://bolao-bbb.vercel.app'}/ranking"
               style="display: inline-block; background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; box-shadow: 0 4px 6px rgba(249, 115, 22, 0.4);">
              Ver Ranking
            </a>
          </div>

          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid rgba(255,255,255,0.1); text-align: center;">
            <p style="color: #6b7280; font-size: 12px; margin: 0;">
              Parabéns @${user.username}! Continue assim!
            </p>
          </div>
        </div>
      `

      await supabaseClient.auth.admin.sendEmail({
        email: user.email,
        subject: `🎉 Você ganhou ${totalPontos} pontos!`,
        html: htmlContent
      })
    }

    return new Response(
      JSON.stringify({ message: `Notified ${users.length} winners` }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})
