const axios = require('axios');
const dayjs = require('dayjs');
const SHEETDB_URL = 'https://sheetdb.io/api/v1/abcd1234'; // sua URL aqui

// Busca os horários padrão para o dia da semana
async function buscarHorariosPadrao(diaSemana) {
  const response = await axios.get(`${SHEETDB_URL}/search?Dia_da_Semana=${diaSemana}`);
  if (response.data.length === 0) return [];
  return response.data[0]['Horários_Disponíveis'].split(',');
}

// Busca horários já agendados para a data
async function buscarHorariosAgendados(data) {
  const response = await axios.get(`${SHEETDB_URL}/search?Data=${data}`);
  return response.data.map(row => row.Hora);
}

// Mostra horários disponíveis
async function horariosDisponiveis(data) {
  const diaSemana = dayjs(data).format('dddd'); // Ex: 'Monday'
  const todos = await buscarHorariosPadrao(traduzDia(diaSemana));
  const agendados = await buscarHorariosAgendados(data);
  return todos.filter(h => !agendados.includes(h));
}

// Função para criar um novo agendamento
async function agendarHorario(data, hora, cliente, telefone) {
  const novoAgendamento = {
    Data: data,
    Hora: hora,
    Cliente: cliente,
    Telefone: telefone,
    Status: 'Confirmado'
  };
  await axios.post(SHEETDB_URL, { data: novoAgendamento });
  console.log(`✅ Agendamento feito: ${cliente} em ${data} às ${hora}`);
}

// Traduz dia da semana de inglês para português
function traduzDia(dia) {
  const mapa = {
    Monday: 'Segunda',
    Tuesday: 'Terça',
    Wednesday: 'Quarta',
    Thursday: 'Quinta',
    Friday: 'Sexta',
    Saturday: 'Sábado',
    Sunday: 'Domingo'
  };
  return mapa[dia];
}

// Teste:
(async () => {
  const dataDesejada = '2025-06-24';
  const horarios = await horariosDisponiveis(dataDesejada);
  console.log(`Horários disponíveis em ${dataDesejada}:`, horarios);

  // Para testar agendamento:
  // await agendarHorario(dataDesejada, '14:00', 'João Teste', '+55 11 90000-0000');
})();
