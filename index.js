const express = require('express');
const axios = require('axios');
const dayjs = require('dayjs');
const app = express();
app.use(express.json());

// ⬇️ Substitua pelas suas URLs e tokens
const SHEETDB_URL = 'https://sheetdb.io/api/v1/68ojhyafg5yyi'; // sua URL
const ZAPI_INSTANCE_ID = '3E32C4A79FB0A0A28DEC2208CC1500D8';
const ZAPI_TOKEN = '28691A35D0A10E2511619D4E';

// Traduz 'Monday' → 'Segunda'
function traduzDia(dia) {
  const mapa = {
    Monday: 'Segunda',
    Tuesday: 'Terça',
    Wednesday: 'Quarta',
    Thursday: 'Quinta',
    Friday: 'Sexta',
    Saturday: 'Sábado',
    Sunday: 'Domingo',
  };
  return mapa[dia];
}

async function buscarHorariosPadrao(diaSemana) {
  const res = await axios.get(`${SHEETDB_URL}/search?Dia_da_Semana=${diaSemana}`);
  if (res.data.length === 0) return [];
  return res.data[0]['Horários_Disponíveis'].split(',').map(h => h.trim());
}

async function buscarHorariosAgendados(data) {
  const res = await axios.get(`${SHEETDB_URL}/search?Data=${data}`);
  return res.data.map(row => row.Hora);
}

async function horariosDisponiveis(data) {
  const diaSemana = traduzDia(dayjs(data).format('dddd'));
  const todos = await buscarHorariosPadrao(diaSemana);
  const ocupados = await buscarHorariosAgendados(data);
  return todos.filter(h => !ocupados.includes(h));
}

async function enviarMensagemZap(telefone, mensagem) {
  const url = `https://api.z-api.io/instances/${ZAPI_INSTANCE_ID}/token/${ZAPI_TOKEN}/send-text`;
  await axios.post(url, {
    phone: telefone,
    message: mensagem,
  });
}

// Rota que o Z-API irá chamar
app.post('/webhook', async (req, res) => {
  const { message, phone } = req.body;

  const hoje = dayjs();
  let dataDesejada = hoje;

  if (message.toLowerCase().includes('amanhã')) {
    dataDesejada = hoje.add(1, 'day');
  }

  if (message.toLowerCase().includes('horário') || message.toLowerCase().includes('agendar')) {
    const dataStr = dataDesejada.format('YYYY-MM-DD');
    const horarios = await horariosDisponiveis(dataStr);

    if (horarios.length === 0) {
      await enviarMensagemZap(phone, `Infelizmente não temos horários disponíveis para ${dataStr}.`);
    } else {
      await enviarMensagemZap(phone,
        `Esses são os horários disponíveis para ${dataStr}:\n${horarios.join(', ')}\nResponda com o horário desejado para agendar.`
      );
    }
  }

  res.sendStatus(200);
});

app.listen(3000, () => console.log('🚀 Webhook rodando na porta 3000'));
